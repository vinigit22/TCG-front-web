import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { Modal } from './modal';

export interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  confirmar?: string;
  cancelar?: string;
  // Ação destrutiva: botão vermelho
  perigo?: boolean;
}

interface Pedido extends OpcoesConfirmacao {
  responder: (sim: boolean) => void;
}

// Pergunta antes de ações que não dá para desfazer: `if (await confirmacao.perguntar({...})) ...`
@Injectable({ providedIn: 'root' })
export class Confirmacao {
  readonly pedido = signal<Pedido | null>(null);

  perguntar(opcoes: OpcoesConfirmacao): Promise<boolean> {
    this.pedido()?.responder(false);
    return new Promise((resolver) => this.pedido.set({ ...opcoes, responder: resolver }));
  }

  responder(sim: boolean): void {
    const pedido = this.pedido();
    if (!pedido) return;
    this.pedido.set(null);
    pedido.responder(sim);
  }
}

@Component({
  selector: 'app-confirmacao',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [aberto]="aberto()"
      (abertoChange)="!$event && confirmacao.responder(false)"
      [titulo]="pedido()?.titulo ?? ''"
    >
      <p class="mensagem">{{ pedido()?.mensagem }}</p>
      <div rodape>
        <button type="button" class="btn btn-secundario" (click)="confirmacao.responder(false)">
          {{ pedido()?.cancelar ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-perigo]="pedido()?.perigo"
          [class.btn-primario]="!pedido()?.perigo"
          (click)="confirmacao.responder(true)"
        >
          {{ pedido()?.confirmar ?? 'Confirmar' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .mensagem {
      color: var(--cor-texto-2);
      line-height: 1.6;
    }
  `,
})
export class ConfirmacaoHost {
  protected readonly confirmacao = inject(Confirmacao);
  protected readonly pedido = this.confirmacao.pedido;
  protected readonly aberto = computed(() => this.pedido() !== null);
}
