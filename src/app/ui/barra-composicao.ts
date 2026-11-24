import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Parte {
  rotulo: string;
  valor: number;
  // Variável CSS da série (--serie-1, --serie-2, --serie-3), na ordem validada da paleta
  cor: string;
}

// Parte de um todo numa barra única empilhada (até 3 partes). Legenda sempre visível com
// quantidade e porcentagem, intervalo de 2px entre as partes e dica ao passar o mouse.
@Component({
  selector: 'app-barra-composicao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="composicao" [attr.aria-label]="titulo()">
      <div class="barra" aria-hidden="true">
        @for (parte of visiveis(); track parte.rotulo) {
          <span
            class="parte"
            tabindex="0"
            [style.flex-grow]="parte.valor"
            [style.background]="'var(' + parte.cor + ')'"
          >
            <span class="dica">
              <b>{{ parte.valor }}</b>
              {{ parte.rotulo }} · {{ porcento(parte.valor) }}%
            </span>
          </span>
        }
        @if (total() === 0) {
          <span class="parte vazia"></span>
        }
      </div>
      <ul class="legenda">
        @for (parte of partes(); track parte.rotulo) {
          <li>
            <span class="amostra" [style.background]="'var(' + parte.cor + ')'"></span>
            <span class="nome">{{ parte.rotulo }}</span>
            <b>{{ parte.valor }}</b>
            <span class="pct">{{ porcento(parte.valor) }}%</span>
          </li>
        }
      </ul>
    </figure>
  `,
  styles: `
    .composicao {
      margin: 0;
    }
    .barra {
      display: flex;
      gap: 2px;
      height: 16px;
      border-radius: 4px;
      overflow: visible;
    }
    .parte {
      position: relative;
      min-width: 6px;
      outline: none;
      transition: filter var(--transicao);
    }
    .parte:first-child {
      border-radius: 4px 0 0 4px;
    }
    .parte:last-child {
      border-radius: 0 4px 4px 0;
    }
    .parte:only-child {
      border-radius: 4px;
    }
    .parte.vazia {
      flex: 1;
      background: var(--tinta-150);
    }
    .parte:hover,
    .parte:focus-visible {
      filter: brightness(1.12);
    }
    .parte:focus-visible {
      box-shadow: var(--anel-foco);
    }
    .dica {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 8px);
      z-index: 5;
      padding: 0.45rem 0.65rem;
      border-radius: 8px;
      background: var(--tinta-900);
      color: var(--tinta-300);
      font-size: 0.75rem;
      white-space: nowrap;
      box-shadow: var(--sombra-md);
      opacity: 0;
      transform: translate(-50%, 4px);
      pointer-events: none;
      transition:
        opacity 120ms,
        transform 120ms;
    }
    .dica b {
      display: block;
      color: #fff;
      font-size: 0.8125rem;
    }
    .parte:hover .dica,
    .parte:focus-visible .dica {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    .legenda {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1.1rem 0 0;
      padding: 0;
      list-style: none;
    }
    .legenda li {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.875rem;
    }
    .amostra {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .nome {
      flex: 1;
      color: var(--cor-texto-2);
    }
    .legenda b {
      font-variant-numeric: tabular-nums;
    }
    .pct {
      width: 3rem;
      text-align: right;
      color: var(--cor-texto-3);
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class BarraComposicao {
  readonly titulo = input.required<string>();
  readonly partes = input.required<Parte[]>();

  protected readonly total = computed(() =>
    this.partes().reduce((soma, parte) => soma + parte.valor, 0),
  );
  protected readonly visiveis = computed(() => this.partes().filter((parte) => parte.valor > 0));

  protected porcento(valor: number): number {
    return this.total() ? Math.round((valor / this.total()) * 100) : 0;
  }
}
