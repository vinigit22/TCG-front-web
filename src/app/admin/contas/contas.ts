import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Conta, TipoConta } from '../../core/models/api';
import { AdministradorService } from '../../core/services/administrador.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ContaService } from '../../core/services/conta.service';
import { LojaService } from '../../core/services/loja.service';
import { SessaoService } from '../../core/services/sessao.service';
import { Avisos } from '../../ui/avisos';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import {
  contem,
  iniciais,
  ROTULO_TIPO_CONTA,
  TOM_TIPO_CONTA,
  tempoRelativo,
} from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { MenuAcoes } from '../../ui/menu-acoes';
import { recurso } from '../../ui/recurso';

type FiltroTipo = 'todas' | TipoConta;
type FiltroSituacao = 'todas' | 'ativas' | 'inativas';

interface LinhaConta {
  conta: Conta;
  nome: string;
  detalhe: string;
  propria: boolean;
}

@Component({
  selector: 'app-contas',
  imports: [DatePipe, Icone, EstadoVazio, MenuAcoes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contas.html',
  styleUrl: './contas.css',
})
export class Contas {
  private readonly servico = inject(ContaService);
  private readonly servicoLojas = inject(LojaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly servicoAdmins = inject(AdministradorService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly idLogado = inject(SessaoService).conta()?.id;

  protected readonly contas = recurso(() => this.servico.listar());
  private readonly lojas = recurso(() => this.servicoLojas.listar());
  private readonly jogadores = recurso(() => this.catalogo.listarJogadores());
  private readonly administradores = recurso(() => this.servicoAdmins.listar());

  protected readonly tipo = signal<FiltroTipo>(
    (inject(ActivatedRoute).snapshot.queryParamMap.get('tipo') as TipoConta | null) ?? 'todas',
  );
  protected readonly situacao = signal<FiltroSituacao>('todas');
  protected readonly busca = signal('');
  protected readonly ocupada = signal<number | null>(null);

  protected readonly rotuloTipo = ROTULO_TIPO_CONTA;
  protected readonly tomTipo = TOM_TIPO_CONTA;
  protected readonly iniciais = iniciais;
  protected readonly tempoRelativo = tempoRelativo;
  protected readonly tipos: { id: FiltroTipo; rotulo: string }[] = [
    { id: 'todas', rotulo: 'Todas' },
    { id: 'LOJA', rotulo: 'Lojas' },
    { id: 'JOGADOR', rotulo: 'Jogadores' },
    { id: 'ADMIN', rotulo: 'Admins' },
  ];

  // Nome de cada conta vem do perfil (loja, jogador ou administrador)
  private readonly linhas = computed<LinhaConta[]>(() => {
    const lojas = new Map((this.lojas.dados() ?? []).map((loja) => [loja.contaId, loja]));
    const jogadores = new Map(
      (this.jogadores.dados() ?? []).map((jogador) => [jogador.contaId, jogador]),
    );
    const admins = new Map(
      (this.administradores.dados() ?? []).map((admin) => [admin.contaId, admin]),
    );
    return (this.contas.dados() ?? []).map((conta) => {
      const loja = lojas.get(conta.id);
      const jogador = jogadores.get(conta.id);
      const admin = admins.get(conta.id);
      return {
        conta,
        nome: loja?.nome ?? jogador?.nome ?? admin?.nome ?? conta.email,
        detalhe: jogador ? `@${jogador.nickname} · ${conta.email}` : conta.email,
        propria: conta.id === this.idLogado,
      };
    });
  });

  protected readonly contagem = computed(() => {
    const contas = this.contas.dados() ?? [];
    return {
      todas: contas.length,
      LOJA: contas.filter((conta) => conta.tipo === 'LOJA').length,
      JOGADOR: contas.filter((conta) => conta.tipo === 'JOGADOR').length,
      ADMIN: contas.filter((conta) => conta.tipo === 'ADMIN').length,
    } as Record<FiltroTipo, number>;
  });

  protected readonly visiveis = computed(() => {
    const tipo = this.tipo();
    const situacao = this.situacao();
    const termo = this.busca();
    return this.linhas()
      .filter((linha) => tipo === 'todas' || linha.conta.tipo === tipo)
      .filter((linha) => situacao === 'todas' || linha.conta.ativo === (situacao === 'ativas'))
      .filter((linha) => contem(linha.nome, termo) || contem(linha.detalhe, termo))
      .sort((a, b) => b.conta.criadoEm.localeCompare(a.conta.criadoEm));
  });

  protected async alternarAtivo(linha: LinhaConta, entrada?: HTMLInputElement): Promise<void> {
    // Se a ação não acontecer, o interruptor volta para o estado real da conta
    const desfazer = () => entrada && (entrada.checked = linha.conta.ativo);
    const ativar = !linha.conta.ativo;
    if (!ativar) {
      const sim = await this.confirmacao.perguntar({
        titulo: 'Desativar conta?',
        mensagem: `${linha.nome} não consegue mais entrar no ${linha.conta.tipo === 'JOGADOR' ? 'app' : 'painel'} até ser reativada.`,
        confirmar: 'Desativar',
        perigo: true,
      });
      if (!sim) {
        desfazer();
        return;
      }
    }
    this.ocupada.set(linha.conta.id);
    this.servico.alterarStatus(linha.conta.id, ativar).subscribe({
      next: (conta) => {
        this.ocupada.set(null);
        this.contas.definir(
          (this.contas.dados() ?? []).map((item) => (item.id === conta.id ? conta : item)),
        );
        this.avisos.sucesso(ativar ? 'Conta reativada' : 'Conta desativada', linha.nome);
      },
      error: (falha: unknown) => {
        this.ocupada.set(null);
        desfazer();
        this.avisos.erro(falha, 'Não foi possível alterar a conta');
      },
    });
  }

  protected async excluir(linha: LinhaConta): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir conta?',
      mensagem: `A conta de ${linha.nome} (${linha.conta.email}) some das listas e não entra mais. Os dados ficam guardados (exclusão lógica).`,
      confirmar: 'Excluir conta',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(linha.conta.id).subscribe({
      next: () => {
        this.avisos.sucesso('Conta excluída', linha.conta.email);
        this.contas.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível excluir'),
    });
  }
}
