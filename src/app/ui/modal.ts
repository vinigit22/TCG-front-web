import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Icone } from './icone';

let proximoId = 1;

// Janela modal sobre o <dialog> nativo (foco preso, Esc fecha, fundo escurecido).
// Os botões do rodapé vão em <div rodape>; para enviar um formulário do corpo, use form="id-do-form".
@Component({
  selector: 'app-modal',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialogo
      class="modal"
      [class.largo]="largo()"
      [attr.aria-labelledby]="idTitulo"
      (close)="aberto.set(false)"
      (click)="cliqueNoFundo($event)"
    >
      <header class="modal-cabecalho">
        <div>
          <h2 [id]="idTitulo">{{ titulo() }}</h2>
          @if (descricao()) {
            <p>{{ descricao() }}</p>
          }
        </div>
        <button type="button" class="btn btn-fantasma btn-sm btn-icone" (click)="aberto.set(false)">
          <app-icone nome="x" />
          <span class="sr-only">Fechar</span>
        </button>
      </header>
      <div class="modal-corpo">
        <ng-content />
      </div>
      <footer class="modal-rodape">
        <ng-content select="[rodape]" />
      </footer>
    </dialog>
  `,
})
export class Modal {
  readonly aberto = model(false);
  readonly titulo = input.required<string>();
  readonly descricao = input<string>();
  readonly largo = input(false);

  protected readonly idTitulo = `modal-titulo-${proximoId++}`;
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      if (this.aberto()) {
        if (!elemento.open && typeof elemento.showModal === 'function') elemento.showModal();
      } else if (elemento.open) {
        elemento.close();
      }
    });
  }

  // Clique fora da caixa (no fundo escurecido) fecha
  protected cliqueNoFundo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.aberto.set(false);
  }
}
