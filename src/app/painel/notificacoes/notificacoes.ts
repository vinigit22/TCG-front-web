import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Notificacao, TipoNotificacao } from '../../core/models/api';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { Avisos } from '../../ui/avisos';
import { EstadoVazio } from '../../ui/estado-vazio';
import { tempoRelativo } from '../../ui/formatar';
import { Icone, NomeIcone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';
import { ContagemNotificacoes } from '../contagem-notificacoes';

const ICONE: Record<TipoNotificacao, NomeIcone> = {
  INSCRICAO_CONFIRMADA: 'usuario-check',
  TORNEIO_INICIADO: 'jogar',
  RODADA_INICIADA: 'chave',
  PAREAMENTO: 'usuarios',
  RESULTADO_REGISTRADO: 'check',
  TORNEIO_FINALIZADO: 'trofeu',
  EVENTO_ATUALIZADO: 'calendario',
  TORNEIO_CANCELADO: 'cancelar',
  AVISO_GERAL: 'megafone',
};

@Component({
  selector: 'app-notificacoes',
  imports: [RouterLink, Icone, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.css',
})
export class Notificacoes {
  private readonly servico = inject(NotificacaoService);
  private readonly contagem = inject(ContagemNotificacoes);
  private readonly avisos = inject(Avisos);

  protected readonly notificacoes = recurso(() => this.servico.listar());
  protected readonly soNaoLidas = signal(false);
  protected readonly icone = ICONE;
  protected readonly tempoRelativo = tempoRelativo;

  protected readonly naoLidas = computed(
    () => (this.notificacoes.dados() ?? []).filter((item) => !item.lida).length,
  );
  protected readonly visiveis = computed(() =>
    (this.notificacoes.dados() ?? []).filter((item) => !this.soNaoLidas() || !item.lida),
  );

  protected marcarComoLida(notificacao: Notificacao): void {
    if (notificacao.lida) return;
    this.servico.marcarComoLida(notificacao.id).subscribe({
      next: () => this.depoisDeMudar(),
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }

  protected marcarTodas(): void {
    this.servico.marcarTodasComoLidas().subscribe({
      next: () => {
        this.avisos.sucesso('Tudo lido');
        this.depoisDeMudar();
      },
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }

  protected excluir(notificacao: Notificacao): void {
    this.servico.excluir(notificacao.id).subscribe({
      next: () => this.depoisDeMudar(),
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }

  private depoisDeMudar(): void {
    this.notificacoes.recarregar();
    this.contagem.atualizar();
  }
}
