import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StatusTorneio } from '../../core/models/api';
import { TRANSICOES_STATUS_TORNEIO } from '../../core/regras';
import { InscricaoService } from '../../core/services/inscricao.service';
import { LojaService } from '../../core/services/loja.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import { enderecoEmTexto } from '../../ui/campos-endereco';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { Icone, NomeIcone } from '../../ui/icone';
import { MenuAcoes } from '../../ui/menu-acoes';
import { recurso } from '../../ui/recurso';
import { SeloTorneio } from '../../ui/selo-status';
import { idDaLojaLogada } from '../loja-atual';
import { AbaChave } from './aba-chave';
import { AbaInscricoes } from './aba-inscricoes';
import { AbaResultados } from './aba-resultados';

interface AcaoStatus {
  destino: StatusTorneio;
  rotulo: string;
  icone: NomeIcone;
  perigo?: boolean;
  confirmar?: { titulo: string; mensagem: string; botao: string };
}

// Linha do tempo do torneio (CANCELADO fica de fora: aparece como aviso)
const ETAPAS: { status: StatusTorneio; rotulo: string }[] = [
  { status: 'RASCUNHO', rotulo: 'Rascunho' },
  { status: 'INSCRICOES_ABERTAS', rotulo: 'Inscrições abertas' },
  { status: 'INSCRICOES_ENCERRADAS', rotulo: 'Check-in' },
  { status: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { status: 'FINALIZADO', rotulo: 'Finalizado' },
];

type IdAba = 'inscricoes' | 'chave' | 'resultados' | 'detalhes';

@Component({
  selector: 'app-detalhe-torneio',
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    Icone,
    SeloTorneio,
    MenuAcoes,
    EstadoVazio,
    AbaInscricoes,
    AbaChave,
    AbaResultados,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalhe-torneio.html',
  styleUrl: './detalhe-torneio.css',
})
export class DetalheTorneio {
  private readonly servico = inject(TorneioService);
  private readonly servicoInscricoes = inject(InscricaoService);
  private readonly servicoResultados = inject(ResultadoService);
  private readonly servicoLoja = inject(LojaService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly id = Number(this.rota.snapshot.paramMap.get('id'));
  protected readonly torneio = recurso(
    () => this.servico.buscar(this.id),
    'Torneio não encontrado.',
  );
  protected readonly inscricoes = recurso(() => this.servicoInscricoes.listarDoTorneio(this.id));
  protected readonly chave = recurso(() => this.servico.listarChaveamento(this.id));
  protected readonly resultados = recurso(() => this.servicoResultados.listarDoTorneio(this.id));
  private readonly lojaId = idDaLojaLogada();
  protected readonly loja = recurso(() => this.servicoLoja.buscar(this.lojaId));

  protected readonly aba = toSignal(
    this.rota.queryParamMap.pipe(map((params) => (params.get('aba') ?? 'inscricoes') as IdAba)),
    { initialValue: 'inscricoes' as IdAba },
  );
  protected readonly etapas = ETAPAS;
  protected readonly ocupado = signal(false);
  protected readonly enderecoEmTexto = enderecoEmTexto;

  protected readonly etapaAtual = computed(() => {
    const status = this.torneio.dados()?.status;
    return ETAPAS.findIndex((etapa) => etapa.status === status);
  });

  protected readonly numeros = computed(() => {
    const lista = this.inscricoes.dados() ?? [];
    const ativas = lista.filter(
      (inscricao) => inscricao.status === 'INSCRITO' || inscricao.status === 'CONFIRMADO',
    );
    return {
      inscritos: ativas.length,
      confirmados: lista.filter((inscricao) => inscricao.status === 'CONFIRMADO').length,
      espera: lista.filter((inscricao) => inscricao.status === 'LISTA_ESPERA').length,
      pendentes: ativas.filter((inscricao) => inscricao.pagamentoStatus === 'PENDENTE').length,
    };
  });

  // Ações de status válidas agora (as mesmas transições que o backend aceita)
  protected readonly acoes = computed<AcaoStatus[]>(() => {
    const torneio = this.torneio.dados();
    if (!torneio) return [];
    return TRANSICOES_STATUS_TORNEIO[torneio.status].map((destino) =>
      acaoPara(torneio.status, destino, torneio.titulo),
    );
  });

  // O próximo passo natural vira o botão principal; o resto vai para "mais ações"
  protected readonly acaoPrincipal = computed(() => {
    const status = this.torneio.dados()?.status;
    const destino = status ? PROXIMO_PASSO[status] : undefined;
    return this.acoes().find((acao) => acao.destino === destino);
  });
  protected readonly outrasAcoes = computed(() =>
    this.acoes().filter((acao) => acao !== this.acaoPrincipal()),
  );

  protected readonly podeExcluir = computed(() => {
    const status = this.torneio.dados()?.status;
    return status === 'RASCUNHO' || status === 'CANCELADO';
  });

  protected abrirAba(aba: IdAba): void {
    this.router.navigate([], { queryParams: { aba }, replaceUrl: true });
  }

  protected atualizarTudo(): void {
    this.torneio.recarregar();
    this.inscricoes.recarregar();
    this.chave.recarregar();
    this.resultados.recarregar();
  }

  protected async alterarStatus(acao: AcaoStatus): Promise<void> {
    if (acao.confirmar) {
      const sim = await this.confirmacao.perguntar({
        titulo: acao.confirmar.titulo,
        mensagem: acao.confirmar.mensagem,
        confirmar: acao.confirmar.botao,
        perigo: acao.perigo,
      });
      if (!sim) return;
    }
    this.ocupado.set(true);
    this.servico.alterarStatus(this.id, acao.destino).subscribe({
      next: (torneio) => {
        this.ocupado.set(false);
        this.torneio.definir(torneio);
        this.inscricoes.recarregar();
        this.avisos.sucesso(MENSAGEM_STATUS[acao.destino] ?? 'Status atualizado');
      },
      error: (falha: unknown) => {
        this.ocupado.set(false);
        this.avisos.erro(falha, 'Não foi possível mudar o status');
      },
    });
  }

  protected async excluir(): Promise<void> {
    const titulo = this.torneio.dados()?.titulo ?? 'este torneio';
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir torneio?',
      mensagem: `"${titulo}" some do painel e do app. Não dá para desfazer.`,
      confirmar: 'Excluir torneio',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(this.id).subscribe({
      next: () => {
        this.avisos.sucesso('Torneio excluído');
        this.router.navigateByUrl('/painel/torneios');
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível excluir'),
    });
  }
}

// Com inscrições encerradas o próximo passo é gerar a chave (aba Chave), e não uma mudança de status
const PROXIMO_PASSO: Partial<Record<StatusTorneio, StatusTorneio>> = {
  RASCUNHO: 'INSCRICOES_ABERTAS',
  INSCRICOES_ABERTAS: 'INSCRICOES_ENCERRADAS',
};

const MENSAGEM_STATUS: Partial<Record<StatusTorneio, string>> = {
  INSCRICOES_ABERTAS: 'Inscrições abertas: o torneio já aparece no app',
  INSCRICOES_ENCERRADAS: 'Inscrições encerradas: hora do check-in',
  RASCUNHO: 'O torneio voltou para rascunho',
  CANCELADO: 'Torneio cancelado. Os inscritos foram avisados.',
};

function acaoPara(atual: StatusTorneio, destino: StatusTorneio, titulo: string): AcaoStatus {
  switch (destino) {
    case 'INSCRICOES_ABERTAS':
      return {
        destino,
        rotulo: atual === 'RASCUNHO' ? 'Abrir inscrições' : 'Reabrir inscrições',
        icone: 'jogar',
      };
    case 'INSCRICOES_ENCERRADAS':
      return {
        destino,
        rotulo: 'Encerrar inscrições',
        icone: 'pausa',
        confirmar: {
          titulo: 'Encerrar inscrições?',
          mensagem:
            'Ninguém mais consegue se inscrever pelo app. Depois faça o check-in de quem chegou e gere a chave.',
          botao: 'Encerrar inscrições',
        },
      };
    case 'RASCUNHO':
      return {
        destino,
        rotulo: 'Voltar para rascunho',
        icone: 'editar',
        confirmar: {
          titulo: 'Voltar para rascunho?',
          mensagem: 'O torneio deixa de aparecer no app até você abrir as inscrições de novo.',
          botao: 'Voltar para rascunho',
        },
      };
    case 'CANCELADO':
      return {
        destino,
        rotulo: 'Cancelar torneio',
        icone: 'cancelar',
        perigo: true,
        confirmar: {
          titulo: 'Cancelar o torneio?',
          mensagem: `Os jogadores inscritos em "${titulo}" recebem o aviso no app. Um torneio cancelado não pode ser reaberto.`,
          botao: 'Cancelar torneio',
        },
      };
    default:
      return { destino, rotulo: destino, icone: 'chevron-direita' };
  }
}
