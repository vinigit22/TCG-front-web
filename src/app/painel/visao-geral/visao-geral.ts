import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento, Notificacao, StatusTorneio, Torneio } from '../../core/models/api';
import { EventoService } from '../../core/services/evento.service';
import { LojaService } from '../../core/services/loja.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { SessaoService } from '../../core/services/sessao.service';
import { TorneioService } from '../../core/services/torneio.service';
import { EstadoVazio } from '../../ui/estado-vazio';
import { paraData, tempoRelativo } from '../../ui/formatar';
import { Icone, NomeIcone } from '../../ui/icone';
import { Medidor } from '../../ui/medidor';
import { recurso } from '../../ui/recurso';
import { SeloTorneio } from '../../ui/selo-status';
import { idDaLojaLogada } from '../loja-atual';

const STATUS_ATIVOS: StatusTorneio[] = [
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'EM_ANDAMENTO',
];

interface Tarefa {
  icone: NomeIcone;
  titulo: string;
  texto: string;
  link: (string | number)[];
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-visao-geral',
  imports: [RouterLink, DatePipe, Icone, Medidor, SeloTorneio, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visao-geral.html',
  styleUrl: './visao-geral.css',
})
export class VisaoGeral {
  private readonly lojaId = idDaLojaLogada();
  protected readonly conta = inject(SessaoService).conta;

  private readonly servicoLoja = inject(LojaService);
  private readonly servicoTorneios = inject(TorneioService);
  private readonly servicoEventos = inject(EventoService);
  private readonly servicoNotificacoes = inject(NotificacaoService);
  protected readonly loja = recurso(() => this.servicoLoja.buscar(this.lojaId));
  protected readonly torneios = recurso(() => this.servicoTorneios.listar({ lojaId: this.lojaId }));
  protected readonly eventos = recurso(() => this.servicoEventos.listar({ lojaId: this.lojaId }));
  protected readonly notificacoes = recurso(() => this.servicoNotificacoes.listar());

  protected readonly hoje = new Date();
  protected readonly saudacao = saudacao(this.hoje);
  protected readonly tempoRelativo = tempoRelativo;

  private readonly ativos = computed(() =>
    (this.torneios.dados() ?? []).filter((torneio) => STATUS_ATIVOS.includes(torneio.status)),
  );

  protected readonly indicadores = computed(() => {
    const ativos = this.ativos();
    const abertos = ativos.filter((torneio) => torneio.status === 'INSCRICOES_ABERTAS');
    const eventos = this.proximosEventos();
    return {
      ativos: ativos.length,
      abertos: abertos.length,
      inscritos: ativos.reduce((soma, torneio) => soma + (torneio.vagasOcupadas ?? 0), 0),
      vagas: abertos.reduce((soma, torneio) => soma + torneio.vagasDisponiveis, 0),
      eventos: eventos.length,
      proximoEvento: eventos[0] as Evento | undefined,
    };
  });

  // Rascunhos e torneios ativos, do mais próximo para o mais distante
  protected readonly proximos = computed(() =>
    (this.torneios.dados() ?? [])
      .filter((torneio) => torneio.status === 'RASCUNHO' || STATUS_ATIVOS.includes(torneio.status))
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
      .slice(0, 5),
  );

  private readonly proximosEventos = computed(() => {
    const agora = Date.now();
    return (this.eventos.dados() ?? [])
      .filter((evento) => evento.status === 'PUBLICADO' || evento.status === 'EM_ANDAMENTO')
      .filter((evento) => (paraData(evento.dataFim ?? evento.dataInicio)?.getTime() ?? 0) >= agora)
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  });

  // O que a loja precisa fazer agora em cada torneio
  protected readonly tarefas = computed<Tarefa[]>(() =>
    (this.torneios.dados() ?? [])
      .flatMap((torneio): Tarefa[] => tarefaDoTorneio(torneio))
      .slice(0, 5),
  );

  protected readonly ultimasNotificacoes = computed<Notificacao[]>(() =>
    (this.notificacoes.dados() ?? []).slice(0, 4),
  );
}

function tarefaDoTorneio(torneio: Torneio): Tarefa[] {
  const link = ['/painel/torneios', torneio.id];
  switch (torneio.status) {
    case 'RASCUNHO':
      return [
        {
          icone: 'editar',
          titulo: torneio.titulo,
          texto: 'Está em rascunho. Revise e abra as inscrições.',
          link,
        },
      ];
    case 'INSCRICOES_ENCERRADAS':
      return [
        {
          icone: 'usuario-check',
          titulo: torneio.titulo,
          texto: 'Inscrições encerradas: faça o check-in e gere a chave.',
          link,
          queryParams: { aba: 'inscricoes' },
        },
      ];
    case 'EM_ANDAMENTO':
      return [
        {
          icone: 'chave',
          titulo: torneio.titulo,
          texto: 'Em andamento: registre os resultados das partidas.',
          link,
          queryParams: { aba: 'chave' },
        },
      ];
    case 'INSCRICOES_ABERTAS':
      return torneio.vagasDisponiveis === 0
        ? [
            {
              icone: 'usuarios',
              titulo: torneio.titulo,
              texto: 'Lotou! Novos jogadores entram na lista de espera.',
              link,
              queryParams: { aba: 'inscricoes' },
            },
          ]
        : [];
    default:
      return [];
  }
}

function saudacao(data: Date): string {
  const hora = data.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
