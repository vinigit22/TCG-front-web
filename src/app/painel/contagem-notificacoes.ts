import { inject, Injectable, signal } from '@angular/core';
import { NotificacaoService } from '../core/services/notificacao.service';

// Total de notificações não lidas, mostrado no menu e no sino do topo.
// A página de notificações chama atualizar() depois de marcar como lida.
@Injectable({ providedIn: 'root' })
export class ContagemNotificacoes {
  private readonly notificacoes = inject(NotificacaoService);
  readonly total = signal(0);

  atualizar(): void {
    this.notificacoes.contarNaoLidas().subscribe({
      next: (total) => this.total.set(total),
      error: () => this.total.set(0),
    });
  }
}
