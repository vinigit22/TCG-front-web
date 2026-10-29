import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Chaveamento, ResultadoPartida, SlotPartida, Torneio } from '../../core/models/api';
import { MINIMO_CONFIRMADOS_PARA_CHAVE, STATUS_PARA_GERAR_CHAVE } from '../../core/regras';
import { PartidaService } from '../../core/services/partida.service';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import { aguardaDesempate, ChaveVisual } from '../../ui/chave-visual';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { paraData } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { Modal } from '../../ui/modal';

interface OpcaoResultado {
  valor: ResultadoPartida;
  rotulo: string;
  ajuda: string;
}

@Component({
  selector: 'app-aba-chave',
  imports: [FormsModule, ChaveVisual, EstadoVazio, Icone, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aba-chave.html',
  styleUrl: './aba-chave.css',
})
export class AbaChave {
  readonly torneio = input.required<Torneio>();
  readonly linhas = input.required<Chaveamento[]>();
  readonly carregando = input(false);
  readonly confirmados = input(0);
  // Nicknames de quem fez check-in mas está com pagamento pendente (o backend recusa a chave)
  readonly semPagamento = input<string[]>([]);
  readonly alterou = output<void>();

  private readonly torneios = inject(TorneioService);
  private readonly partidas = inject(PartidaService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly minimo = MINIMO_CONFIRMADOS_PARA_CHAVE;
  protected readonly gerando = signal(false);
  protected readonly salvando = signal(false);

  // Partida aberta na janela. Vem sempre de `linhas`, que a tela recarrega sozinha durante o torneio:
  // assim o check-in dos jogadores aparece na janela sem precisar fechá-la.
  private readonly partidaId = signal<number | null>(null);
  protected readonly partida = computed(() => {
    const id = this.partidaId();
    return id === null ? null : (this.linhas().find((linha) => linha.partidaId === id) ?? null);
  });
  protected readonly modalAberto = computed(() => this.partida() !== null);

  // Relógio da contagem regressiva do check-in (só anda com a janela aberta)
  private readonly agora = signal(Date.now());
  protected readonly checkIn = computed(() => {
    const partida = this.partida();
    if (!partida) return null;
    const expira = paraData(partida.checkInExpiraEm)?.getTime() ?? 0;
    const segundos = Math.max(0, Math.ceil((expira - this.agora()) / 1000));
    return {
      chamados: expira > 0,
      aberto: segundos > 0,
      tempo: `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`,
    };
  });
  protected gamesA = 0;
  protected gamesB = 0;
  protected resultado: ResultadoPartida | null = null;

  protected readonly inscricoesEncerradas = computed(
    () => this.torneio().status === STATUS_PARA_GERAR_CHAVE,
  );
  protected readonly podeGerar = computed(
    () =>
      this.inscricoesEncerradas() &&
      this.confirmados() >= this.minimo &&
      this.semPagamento().length === 0,
  );
  protected readonly interativa = computed(() => this.torneio().status === 'EM_ANDAMENTO');

  private readonly ultimaRodada = computed(() =>
    Math.max(0, ...this.linhas().map((linha) => linha.rodada)),
  );
  protected readonly campeao = computed(() => {
    if (this.torneio().status !== 'FINALIZADO') return null;
    return this.linhas().find((linha) => linha.rodada === this.ultimaRodada())?.vencedor ?? null;
  });

  protected readonly andamento = computed(() => {
    const linhas = this.linhas().filter((linha) => linha.jogadorA && linha.jogadorB);
    return {
      total: linhas.length,
      finalizadas: linhas.filter((linha) => linha.status === 'FINALIZADA').length,
    };
  });

  protected readonly ehFinal = computed(() => this.partida()?.rodada === this.ultimaRodada());

  constructor() {
    afterNextRender(() => {
      const relogio = setInterval(() => {
        if (this.partidaId() !== null) this.agora.set(Date.now());
      }, 1000);
      this.destroyRef.onDestroy(() => clearInterval(relogio));
    });
  }
  protected readonly emDesempate = computed(() => {
    const partida = this.partida();
    return !!partida && aguardaDesempate(partida);
  });

  protected readonly opcoes = computed<OpcaoResultado[]>(() => {
    const partida = this.partida();
    const a = partida?.jogadorA ?? 'Jogador A';
    const b = partida?.jogadorB ?? 'Jogador B';
    const lista: OpcaoResultado[] = [
      { valor: 'VITORIA_A', rotulo: `Vitória de ${a}`, ajuda: `${a} avança na chave` },
      { valor: 'VITORIA_B', rotulo: `Vitória de ${b}`, ajuda: `${b} avança na chave` },
      { valor: 'EMPATE', rotulo: 'Empate', ajuda: 'Depois você decide o desempate' },
      { valor: 'WO_A', rotulo: `W.O. para ${a}`, ajuda: `${b} não compareceu` },
      { valor: 'WO_B', rotulo: `W.O. para ${b}`, ajuda: `${a} não compareceu` },
    ];
    // A final precisa de um campeão
    if (!this.ehFinal()) {
      lista.push({
        valor: 'DUPLO_NO_SHOW',
        rotulo: 'Nenhum compareceu',
        ajuda: 'Ninguém avança desta mesa',
      });
    }
    return lista;
  });

  protected async gerarChave(): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Gerar a chave?',
      mensagem: `Os ${this.confirmados()} jogadores com check-in serão sorteados. Depois disso as inscrições não mudam mais e o torneio fica em andamento.`,
      confirmar: 'Sortear e gerar chave',
    });
    if (!sim) return;
    this.gerando.set(true);
    this.torneios.gerarChaveamento(this.torneio().id).subscribe({
      next: () => {
        this.gerando.set(false);
        this.avisos.sucesso('Chave gerada!', 'Os jogadores foram avisados no app. Bom torneio!');
        this.alterou.emit();
      },
      error: (falha: unknown) => {
        this.gerando.set(false);
        this.avisos.erro(falha, 'Não foi possível gerar a chave');
      },
    });
  }

  protected abrirPartida(partida: Chaveamento): void {
    this.gamesA = partida.gamesA;
    this.gamesB = partida.gamesB;
    this.resultado = null;
    this.agora.set(Date.now());
    this.partidaId.set(partida.partidaId);
  }

  protected fecharPartida(): void {
    this.partidaId.set(null);
  }

  // Chama os dois jogadores: o app deles abre a tela verde de confirmação. A partida só começa quando
  // os dois confirmam; passados 5 minutos, quem confirmou vence por W.O. (o backend faz isso sozinho).
  protected convocar(): void {
    const partida = this.partida();
    if (!partida) return;
    this.salvando.set(true);
    this.partidas.convocar(partida.partidaId).subscribe({
      next: () => {
        this.salvando.set(false);
        this.agora.set(Date.now());
        this.avisos.sucesso('Jogadores chamados', 'Eles têm 5 minutos para confirmar presença no app.');
        this.alterou.emit();
      },
      error: (falha: unknown) => {
        this.salvando.set(false);
        this.avisos.erro(falha, 'Não foi possível chamar os jogadores');
      },
    });
  }

  // O placar sugere o resultado (o usuário ainda pode trocar)
  protected placarMudou(): void {
    if (this.gamesA > this.gamesB) this.resultado = 'VITORIA_A';
    else if (this.gamesB > this.gamesA) this.resultado = 'VITORIA_B';
    else if (this.gamesA > 0) this.resultado = 'EMPATE';
  }

  protected ajustar(lado: 'A' | 'B', delta: number): void {
    if (lado === 'A') this.gamesA = Math.max(0, Math.min(5, this.gamesA + delta));
    else this.gamesB = Math.max(0, Math.min(5, this.gamesB + delta));
    this.placarMudou();
  }

  protected registrar(): void {
    const partida = this.partida();
    if (!partida || !this.resultado) return;
    this.enviar(
      this.partidas.registrarResultado(partida.partidaId, {
        gamesA: this.gamesA,
        gamesB: this.gamesB,
        resultado: this.resultado,
      }),
      this.resultado === 'EMPATE'
        ? 'Empate registrado: decida o desempate'
        : 'Resultado registrado',
    );
  }

  protected desempatar(vencedor: SlotPartida): void {
    const partida = this.partida();
    if (!partida) return;
    this.enviar(
      this.partidas.registrarDesempate(partida.partidaId, vencedor),
      'Desempate registrado',
    );
  }

  protected async reabrir(): Promise<void> {
    const partida = this.partida();
    if (!partida) return;
    this.enviar(
      this.partidas.reabrir(partida.partidaId),
      'Partida reaberta: registre o resultado correto',
    );
  }

  private enviar(acao: Observable<unknown>, mensagem: string): void {
    this.salvando.set(true);
    acao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.partidaId.set(null);
        this.avisos.sucesso(mensagem);
        this.alterou.emit();
      },
      error: (falha: unknown) => {
        this.salvando.set(false);
        this.avisos.erro(falha, 'Não foi possível salvar');
      },
    });
  }
}
