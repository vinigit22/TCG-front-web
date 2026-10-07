import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { Icone, NomeIcone } from './icone';

// Botão "mais ações" que abre uma lista de botões (ng-content). Fecha ao clicar fora, numa opção ou com Esc.
@Component({
  selector: 'app-menu-acoes',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cliqueFora($event)',
    '(keydown.escape)': 'aberto.set(false)',
  },
  template: `
    <button
      type="button"
      class="btn btn-secundario"
      [class.btn-icone]="!rotulo()"
      [class.btn-sm]="pequeno()"
      aria-haspopup="true"
      [attr.aria-expanded]="aberto()"
      (click)="aberto.set(!aberto())"
    >
      <app-icone [nome]="icone()" [tamanho]="16" />
      @if (rotulo()) {
        {{ rotulo() }}
      } @else {
        <span class="sr-only">Mais ações</span>
      }
    </button>
    @if (aberto()) {
      <div class="menu" role="menu" (click)="aberto.set(false)">
        <ng-content />
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
    }
    .menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 50;
      min-width: 220px;
      padding: 0.35rem;
      border-radius: 12px;
      background: var(--cor-superficie);
      border: 1px solid var(--cor-borda);
      box-shadow: var(--sombra-md);
      animation: abrir 140ms ease-out;
    }
    :host ::ng-deep .menu > button {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: 0;
      border-radius: 8px;
      background: none;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      color: var(--cor-texto);
    }
    :host ::ng-deep .menu > button:hover:not(:disabled) {
      background: var(--tinta-100);
    }
    :host ::ng-deep .menu > button.perigo {
      color: var(--vermelho-700);
    }
    :host ::ng-deep .menu > button.perigo:hover:not(:disabled) {
      background: var(--vermelho-100);
    }
    :host ::ng-deep .menu > button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    :host ::ng-deep .menu > hr {
      margin: 0.3rem 0.2rem;
      border: 0;
      border-top: 1px solid var(--cor-borda);
    }
    @keyframes abrir {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }
  `,
})
export class MenuAcoes {
  readonly rotulo = input<string>();
  readonly icone = input<NomeIcone>('pontos');
  readonly pequeno = input(false);
  protected readonly aberto = signal(false);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected cliqueFora(evento: MouseEvent): void {
    if (this.aberto() && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.aberto.set(false);
    }
  }
}
