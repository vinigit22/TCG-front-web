import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Loja, StatusTorneio } from '../../core/models/api';
import { ContaService } from '../../core/services/conta.service';
import { LojaService } from '../../core/services/loja.service';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { contem, iniciais } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { MenuAcoes } from '../../ui/menu-acoes';
import { recurso } from '../../ui/recurso';

type Filtro = 'todas' | 'verificadas' | 'pendentes';
const ATIVOS: StatusTorneio[] = ['INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO'];

@Component({
  selector: 'app-lojas-admin',
  imports: [DatePipe, RouterLink, Icone, EstadoVazio, MenuAcoes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lojas-admin.html',
  styleUrl: './lojas-admin.css',
})
export class LojasAdmin {
  private readonly servico = inject(LojaService);
  private readonly servicoTorneios = inject(TorneioService);
  private readonly servicoContas = inject(ContaService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);

  protected readonly lojas = recurso(() => this.servico.listar());
  private readonly torneios = recurso(() => this.servicoTorneios.listar());
  private readonly contas = recurso(() => this.servicoContas.listar('LOJA'));

  protected readonly filtro = signal<Filtro>(
    (inject(ActivatedRoute).snapshot.queryParamMap.get('filtro') as Filtro | null) ?? 'todas',
  );
  protected readonly busca = signal('');
  protected readonly ocupada = signal<number | null>(null);
  protected readonly iniciais = iniciais;

  protected readonly filtros: { id: Filtro; rotulo: string }[] = [
    { id: 'todas', rotulo: 'Todas' },
    { id: 'pendentes', rotulo: 'Aguardando verificação' },
    { id: 'verificadas', rotulo: 'Verificadas' },
  ];

  protected readonly contagem = computed(() => {
    const lojas = this.lojas.dados() ?? [];
    return {
      todas: lojas.length,
      verificadas: lojas.filter((loja) => loja.verificada).length,
      pendentes: lojas.filter((loja) => !loja.verificada).length,
    } as Record<Filtro, number>;
  });

  private readonly torneiosPorLoja = computed(() => {
    const mapa = new Map<number, { total: number; ativos: number }>();
    for (const torneio of this.torneios.dados() ?? []) {
      const atual = mapa.get(torneio.loja.contaId) ?? { total: 0, ativos: 0 };
      atual.total++;
      if (ATIVOS.includes(torneio.status)) atual.ativos++;
      mapa.set(torneio.loja.contaId, atual);
    }
    return mapa;
  });

  private readonly contasPorId = computed(
    () => new Map((this.contas.dados() ?? []).map((conta) => [conta.id, conta])),
  );

  protected readonly visiveis = computed(() => {
    const filtro = this.filtro();
    const termo = this.busca();
    return (this.lojas.dados() ?? [])
      .filter((loja) => filtro === 'todas' || loja.verificada === (filtro === 'verificadas'))
      .filter(
        (loja) =>
          contem(loja.nome, termo) ||
          contem(loja.endereco?.cidade, termo) ||
          contem(loja.slug, termo),
      )
      .map((loja) => ({
        loja,
        torneios: this.torneiosPorLoja().get(loja.contaId) ?? { total: 0, ativos: 0 },
        conta: this.contasPorId().get(loja.contaId),
      }))
      .sort(
        (a, b) =>
          Number(a.loja.verificada) - Number(b.loja.verificada) ||
          a.loja.nome.localeCompare(b.loja.nome),
      );
  });

  protected alterarVerificacao(loja: Loja, verificada: boolean): void {
    this.ocupada.set(loja.contaId);
    this.servico.alterarVerificacao(loja.contaId, verificada).subscribe({
      next: (atualizada) => {
        this.ocupada.set(null);
        this.lojas.definir(
          (this.lojas.dados() ?? []).map((item) =>
            item.contaId === atualizada.contaId ? atualizada : item,
          ),
        );
        this.avisos.sucesso(verificada ? 'Loja verificada' : 'Selo removido', loja.nome);
      },
      error: (falha: unknown) => {
        this.ocupada.set(null);
        this.avisos.erro(falha, 'Não foi possível alterar a verificação');
      },
    });
  }

  protected async removerSelo(loja: Loja): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Remover o selo de verificada?',
      mensagem: `${loja.nome} deixa de aparecer como verificada no app.`,
      confirmar: 'Remover selo',
      perigo: true,
    });
    if (sim) this.alterarVerificacao(loja, false);
  }

  protected async excluir(loja: Loja): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir loja?',
      mensagem: `${loja.nome} some da plataforma, junto com a vitrine de torneios no app.`,
      confirmar: 'Excluir loja',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(loja.contaId).subscribe({
      next: () => {
        this.avisos.sucesso('Loja excluída', loja.nome);
        this.lojas.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível excluir'),
    });
  }
}
