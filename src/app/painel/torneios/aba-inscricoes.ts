import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { urlImagem } from '../../core/configuracao';
import {
  Inscricao,
  Jogador,
  StatusInscricao,
  StatusPagamento,
  Torneio,
} from '../../core/models/api';
import { podeAlterarInscricoes } from '../../core/regras';
import { ROTULOS_STATUS_INSCRICAO, ROTULOS_STATUS_PAGAMENTO } from '../../core/rotulos';
import { InscricaoService } from '../../core/services/inscricao.service';
import { Avisos } from '../../ui/avisos';
import { BuscarJogador } from '../../ui/buscar-jogador';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { contem, iniciais, TOM_PAGAMENTO, TOM_STATUS_INSCRICAO } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { MenuAcoes } from '../../ui/menu-acoes';

type Filtro = 'todas' | 'ativas' | 'confirmadas' | 'espera' | 'canceladas';

const FILTROS: { id: Filtro; rotulo: string; status: StatusInscricao[] }[] = [
  { id: 'todas', rotulo: 'Todas', status: [] },
  { id: 'ativas', rotulo: 'Aguardando check-in', status: ['INSCRITO'] },
  { id: 'confirmadas', rotulo: 'Check-in feito', status: ['CONFIRMADO'] },
  { id: 'espera', rotulo: 'Lista de espera', status: ['LISTA_ESPERA'] },
  { id: 'canceladas', rotulo: 'Canceladas', status: ['CANCELADO', 'NO_SHOW'] },
];

// Ordem da tabela: quem precisa de ação primeiro
const ORDEM: Record<StatusInscricao, number> = {
  INSCRITO: 0,
  CONFIRMADO: 1,
  LISTA_ESPERA: 2,
  NO_SHOW: 3,
  CANCELADO: 4,
};

@Component({
  selector: 'app-aba-inscricoes',
  imports: [DatePipe, Icone, EstadoVazio, MenuAcoes, BuscarJogador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aba-inscricoes.html',
  styleUrl: './aba-inscricoes.css',
})
export class AbaInscricoes {
  readonly torneio = input.required<Torneio>();
  readonly inscricoes = input.required<Inscricao[]>();
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly alterou = output<void>();

  private readonly servico = inject(InscricaoService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly busca = viewChild(BuscarJogador);

  protected readonly filtros = FILTROS;
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly termo = signal('');
  protected readonly ocupada = signal<number | null>(null);
  protected readonly inscrevendo = signal(false);
  protected readonly buscaAberta = signal(false);

  protected readonly rotuloStatus = ROTULOS_STATUS_INSCRICAO;
  protected readonly rotuloPagamento = ROTULOS_STATUS_PAGAMENTO;
  protected readonly tomStatus = TOM_STATUS_INSCRICAO;
  protected readonly tomPagamento = TOM_PAGAMENTO;
  protected readonly opcoesPagamento = Object.keys(ROTULOS_STATUS_PAGAMENTO) as StatusPagamento[];
  protected readonly iniciais = iniciais;

  // Depois da chave sorteada, nenhuma inscrição muda de status
  protected readonly editavel = computed(
    () => podeAlterarInscricoes(this.torneio().status) && this.torneio().status !== 'CANCELADO',
  );
  protected readonly podeInscrever = computed(
    () => this.editavel() && this.torneio().status !== 'FINALIZADO',
  );

  protected readonly contagem = computed(() => {
    const lista = this.inscricoes();
    return Object.fromEntries(
      FILTROS.map((filtro) => [
        filtro.id,
        filtro.status.length
          ? lista.filter((inscricao) => filtro.status.includes(inscricao.status)).length
          : lista.length,
      ]),
    ) as Record<Filtro, number>;
  });

  protected readonly visiveis = computed(() => {
    const filtro = FILTROS.find((item) => item.id === this.filtro())!;
    const termo = this.termo();
    return this.inscricoes()
      .filter((inscricao) => filtro.status.length === 0 || filtro.status.includes(inscricao.status))
      .filter(
        (inscricao) =>
          contem(inscricao.jogador.nome, termo) || contem(inscricao.jogador.nickname, termo),
      )
      .sort(
        (a, b) => ORDEM[a.status] - ORDEM[b.status] || a.inscritoEm.localeCompare(b.inscritoEm),
      );
  });

  protected imagem(jogador: Jogador): string | undefined {
    return urlImagem(jogador.imagemPerfil);
  }

  protected fazerCheckIn(inscricao: Inscricao): void {
    this.executar(
      inscricao,
      this.servico.fazerCheckIn(inscricao.id),
      `Check-in de ${inscricao.jogador.nickname} feito`,
    );
  }

  protected mudarPagamento(inscricao: Inscricao, valor: string): void {
    const pagamentoStatus = valor as StatusPagamento;
    if (pagamentoStatus === inscricao.pagamentoStatus) return;
    this.executar(
      inscricao,
      this.servico.atualizar(inscricao.id, { pagamentoStatus }),
      `Pagamento: ${ROTULOS_STATUS_PAGAMENTO[pagamentoStatus].toLowerCase()}`,
    );
  }

  protected async marcarNoShow(inscricao: Inscricao): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Marcar como não compareceu?',
      mensagem: `${inscricao.jogador.nome} fica fora da chave.`,
      confirmar: 'Marcar ausência',
    });
    if (sim)
      this.executar(
        inscricao,
        this.servico.atualizar(inscricao.id, { status: 'NO_SHOW' }),
        'Ausência registrada',
      );
  }

  protected async cancelar(inscricao: Inscricao): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Cancelar inscrição?',
      mensagem: `A vaga de ${inscricao.jogador.nome} é liberada e o primeiro da lista de espera sobe.`,
      confirmar: 'Cancelar inscrição',
      perigo: true,
    });
    if (sim) this.executar(inscricao, this.servico.cancelar(inscricao.id), 'Inscrição cancelada');
  }

  protected inscrever(jogador: Jogador): void {
    this.inscrevendo.set(true);
    this.servico.inscreverJogador(this.torneio().id, jogador.contaId).subscribe({
      next: (inscricao) => {
        this.inscrevendo.set(false);
        this.buscaAberta.set(false);
        this.busca()?.limpar();
        this.avisos.sucesso(
          inscricao.status === 'LISTA_ESPERA' ? 'Jogador na lista de espera' : 'Jogador inscrito',
          `${jogador.nome} (@${jogador.nickname})`,
        );
        this.alterou.emit();
      },
      error: (falha: unknown) => {
        this.inscrevendo.set(false);
        this.avisos.erro(falha, 'Não foi possível inscrever');
      },
    });
  }

  private executar(
    inscricao: Inscricao,
    acao: ReturnType<InscricaoService['buscar']>,
    mensagem: string,
  ): void {
    this.ocupada.set(inscricao.id);
    acao.subscribe({
      next: () => {
        this.ocupada.set(null);
        this.avisos.sucesso(mensagem);
        this.alterou.emit();
      },
      error: (falha: unknown) => {
        this.ocupada.set(null);
        this.avisos.erro(falha);
        this.alterou.emit();
      },
    });
  }
}
