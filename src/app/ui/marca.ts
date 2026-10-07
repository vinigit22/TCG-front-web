import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Símbolo do TopDeck: duas cartas em leque (roxo e verde) com uma estrela
@Component({
  selector: 'app-marca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="tamanho()" [attr.height]="tamanho()" viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="5"
        y="5"
        width="15"
        height="21"
        rx="3.5"
        transform="rotate(-13 12.5 15.5)"
        fill="#6c4ce0"
      />
      <rect
        x="11"
        y="5.5"
        width="15"
        height="21"
        rx="3.5"
        transform="rotate(9 18.5 16)"
        fill="#34cf96"
      />
      <path
        d="M18.6 11.4l1.35 2.75 3.03.44-2.19 2.14.52 3.02-2.71-1.43-2.71 1.43.52-3.02-2.19-2.14 3.03-.44z"
        fill="#130c2a"
      />
    </svg>
    @if (comNome()) {
      <span class="nome marca-texto">Top<span>Deck</span></span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
    }
    .nome {
      font-size: 1.15rem;
      color: #fff;
      line-height: 1;
    }
    .nome span {
      color: var(--verde-300);
    }
  `,
})
export class Marca {
  readonly tamanho = input(32);
  readonly comNome = input(true);
}
