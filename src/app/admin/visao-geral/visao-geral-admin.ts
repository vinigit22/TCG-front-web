import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Loja, StatusTorneio } from '../../core/models/api';
import { ROTULOS_STATUS_TORNEIO } from '../../core/rotulos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ContaService } from '../../core/services/conta.service';
import { LojaService } from '../../core/services/loja.service';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import { BarraComposicao, Parte } from '../../ui/barra-composicao';
import { enderecoEmTexto } from '../../ui/campos-endereco';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais, ROTULO_TIPO_CONTA, TOM_TIPO_CONTA, tempoRelativo } from '../../ui/formatar';
import { Barra, GraficoBarras } from '../../ui/grafico-barras';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';

// Ordem do ciclo de vida (o gráfico segue a ordem das fases)
const ORDEM_STATUS: StatusTorneio[] = [
  'RASCUNHO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'EM_ANDAMENTO',
  'FINALIZADO',
  'CANCELADO',
];

@Component({
  selector: 'app-visao-geral-admin',
  imports: [RouterLink, DatePipe, Icone, EstadoVazio, GraficoBarras, BarraComposicao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visao-geral-admin.html',
  styleUrl: './visao-geral-admin.css',
})
export class VisaoGeralAdmin {
  private readonly servicoContas = inject(ContaService);
  private readonly servicoLojas = inject(LojaService);
  private readonly servicoTorneios = inject(TorneioService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(Avisos);

  protected readonly contas = recurso(() => this.servicoContas.listar());
  protected readonly lojas = recurso(() => this.servicoLojas.listar());
  protected readonly torneios = recurso(() => this.servicoTorneios.listar());
  protected readonly jogos = recurso(() => this.catalogo.listarJogos());

  protected readonly verificando = signal<number | null>(null);
  protected readonly hoje = new Date();
  protected readonly iniciais = iniciais;
  protected readonly tempoRelativo = tempoRelativo;
  protected readonly enderecoEmTexto = enderecoEmTexto;
  protected readonly rotuloTipo = ROTULO_TIPO_CONTA;
  protected readonly tomTipo = TOM_TIPO_CONTA;

  protected readonly indicadores = computed(() => {
    const contas = this.contas.dados() ?? [];
    const lojas = this.lojas.dados() ?? [];
    const torneios = this.torneios.dados() ?? [];
    const ativos: StatusTorneio[] = ['INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO'];
    return {
      contas: contas.length,
      contasAtivas: contas.filter((conta) => conta.ativo).length,
      lojas: lojas.length,
      verificadas: lojas.filter((loja) => loja.verificada).length,
      jogadores: contas.filter((conta) => conta.tipo === 'JOGADOR').length,
      torneiosAtivos: torneios.filter((torneio) => ativos.includes(torneio.status)).length,
      finalizados: torneios.filter((torneio) => torneio.status === 'FINALIZADO').length,
      jogosAtivos: (this.jogos.dados() ?? []).filter((jogo) => jogo.ativo).length,
    };
  });

  // Lojas, jogadores e admins na ordem validada da paleta (roxo, verde, âmbar)
  protected readonly composicaoContas = computed<Parte[]>(() => {
    const contas = this.contas.dados() ?? [];
    const contar = (tipo: string) => contas.filter((conta) => conta.tipo === tipo).length;
    return [
      { rotulo: 'Lojas', valor: contar('LOJA'), cor: '--serie-1' },
      { rotulo: 'Jogadores', valor: contar('JOGADOR'), cor: '--serie-2' },
      { rotulo: 'Administradores', valor: contar('ADMIN'), cor: '--serie-3' },
    ];
  });

  protected readonly torneiosPorStatus = computed<Barra[]>(() => {
    const torneios = this.torneios.dados() ?? [];
    return ORDEM_STATUS.map((status) => ({
      rotulo: ROTULOS_STATUS_TORNEIO[status],
      valor: torneios.filter((torneio) => torneio.status === status).length,
    }));
  });

  protected readonly pendentes = computed(() =>
    (this.lojas.dados() ?? []).filter((loja) => !loja.verificada).slice(0, 5),
  );

  protected readonly recentes = computed(() =>
    [...(this.contas.dados() ?? [])]
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .slice(0, 6),
  );

  protected verificar(loja: Loja): void {
    this.verificando.set(loja.contaId);
    this.servicoLojas.alterarVerificacao(loja.contaId, true).subscribe({
      next: () => {
        this.verificando.set(null);
        this.avisos.sucesso('Loja verificada', `${loja.nome} agora tem o selo no app.`);
        this.lojas.recarregar();
      },
      error: (falha: unknown) => {
        this.verificando.set(null);
        this.avisos.erro(falha, 'Não foi possível verificar');
      },
    });
  }
}
