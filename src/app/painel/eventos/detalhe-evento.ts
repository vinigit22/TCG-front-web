import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventoParticipacao, Jogador, StatusEvento } from '../../core/models/api';
import { ROTULOS_STATUS_EVENTO, ROTULOS_TIPO_EVENTO } from '../../core/rotulos';
import { EventoService } from '../../core/services/evento.service';
import { LojaService } from '../../core/services/loja.service';
import { Avisos } from '../../ui/avisos';
import { BuscarJogador } from '../../ui/buscar-jogador';
import { enderecoEmTexto } from '../../ui/campos-endereco';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais, TOM_STATUS_EVENTO } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { MenuAcoes } from '../../ui/menu-acoes';
import { recurso } from '../../ui/recurso';
import { idDaLojaLogada } from '../loja-atual';
import { ACOES_EVENTO, eventoParaRequest, ICONE_TIPO_EVENTO } from './evento-util';

@Component({
  selector: 'app-detalhe-evento',
  imports: [RouterLink, DatePipe, Icone, EstadoVazio, MenuAcoes, BuscarJogador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalhe-evento.html',
  styleUrl: './detalhe-evento.css',
})
export class DetalheEvento {
  private readonly servico = inject(EventoService);
  private readonly servicoLoja = inject(LojaService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly router = inject(Router);
  private readonly busca = viewChild(BuscarJogador);

  protected readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly lojaId = idDaLojaLogada();
  protected readonly evento = recurso(() => this.servico.buscar(this.id), 'Evento não encontrado.');
  protected readonly participacoes = recurso(() => this.servico.listarParticipacoes(this.id));
  protected readonly loja = recurso(() => this.servicoLoja.buscar(this.lojaId));

  protected readonly rotuloTipo = ROTULOS_TIPO_EVENTO;
  protected readonly rotuloStatus = ROTULOS_STATUS_EVENTO;
  protected readonly tomStatus = TOM_STATUS_EVENTO;
  protected readonly iconeTipo = ICONE_TIPO_EVENTO;
  protected readonly enderecoEmTexto = enderecoEmTexto;
  protected readonly iniciais = iniciais;

  protected readonly ocupado = signal(false);
  protected readonly buscaAberta = signal(false);
  protected readonly inscrevendo = signal(false);

  protected readonly acoes = computed(() => {
    const status = this.evento.dados()?.status;
    return status ? ACOES_EVENTO[status] : [];
  });

  protected readonly confirmados = computed(
    () =>
      (this.participacoes.dados() ?? []).filter(
        (participacao) => participacao.status === 'CONFIRMADO',
      ).length,
  );

  protected readonly aberto = computed(() => {
    const status = this.evento.dados()?.status;
    return status === 'PUBLICADO' || status === 'EM_ANDAMENTO';
  });

  protected alterarStatus(destino: StatusEvento, mensagem = 'Status atualizado'): void {
    const evento = this.evento.dados();
    if (!evento) return;
    this.ocupado.set(true);
    this.servico.atualizar(evento.id, eventoParaRequest(evento, { status: destino })).subscribe({
      next: (atualizado) => {
        this.ocupado.set(false);
        this.evento.definir(atualizado);
        this.avisos.sucesso(mensagem);
      },
      error: (falha: unknown) => {
        this.ocupado.set(false);
        this.avisos.erro(falha, 'Não foi possível mudar o status');
      },
    });
  }

  protected async cancelarEvento(): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Cancelar o evento?',
      mensagem: 'Quem confirmou presença recebe o aviso no app.',
      confirmar: 'Cancelar evento',
      perigo: true,
    });
    if (sim) this.alterarStatus('CANCELADO', 'Evento cancelado');
  }

  protected async excluir(): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir evento?',
      mensagem: 'O evento some do painel e do app. Não dá para desfazer.',
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(this.id).subscribe({
      next: () => {
        this.avisos.sucesso('Evento excluído');
        this.router.navigateByUrl('/painel/eventos');
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível excluir'),
    });
  }

  protected inscrever(jogador: Jogador): void {
    this.inscrevendo.set(true);
    this.servico.inscreverJogador(this.id, jogador.contaId).subscribe({
      next: () => {
        this.inscrevendo.set(false);
        this.buscaAberta.set(false);
        this.busca()?.limpar();
        this.avisos.sucesso('Presença confirmada', `${jogador.nome} (@${jogador.nickname})`);
        this.participacoes.recarregar();
      },
      error: (falha: unknown) => {
        this.inscrevendo.set(false);
        this.avisos.erro(falha, 'Não foi possível confirmar');
      },
    });
  }

  protected alternarParticipacao(participacao: EventoParticipacao): void {
    const status = participacao.status === 'CONFIRMADO' ? 'CANCELADO' : 'CONFIRMADO';
    this.servico.alterarParticipacao(participacao.id, status).subscribe({
      next: () => {
        this.avisos.sucesso(status === 'CONFIRMADO' ? 'Presença confirmada' : 'Presença cancelada');
        this.participacoes.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }
}
