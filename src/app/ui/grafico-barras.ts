import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Barra {
  rotulo: string;
  valor: number;
}

// Barras horizontais de uma série só (uma cor). Valor escrito na ponta de cada barra,
// dica ao passar o mouse ou focar, e uma tabela equivalente para leitores de tela.
@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="grafico" [attr.aria-label]="titulo()">
      <div class="linhas" aria-hidden="true">
        @for (barra of barras(); track barra.rotulo) {
          <div class="linha" tabindex="0">
            <span class="rotulo">{{ barra.rotulo }}</span>
            <span class="trilho">
              <span
                class="barra"
                [style.width.%]="largura(barra.valor)"
                [class.zero]="barra.valor === 0"
              ></span>
              <span class="valor">{{ barra.valor }}</span>
              <span class="dica">
                <b>{{ barra.valor }} {{ barra.valor === 1 ? unidade() : unidadePlural() }}</b>
                {{ barra.rotulo }} · {{ porcento(barra.valor) }}%
              </span>
            </span>
          </div>
        }
      </div>
      <table class="sr-only">
        <caption>
          {{
            titulo()
          }}
        </caption>
        <tr>
          <th scope="col">Categoria</th>
          <th scope="col">Quantidade</th>
        </tr>
        @for (barra of barras(); track barra.rotulo) {
          <tr>
            <td>{{ barra.rotulo }}</td>
            <td>{{ barra.valor }}</td>
          </tr>
        }
      </table>
    </figure>
  `,
  styles: `
    .grafico {
      margin: 0;
    }
    .linhas {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .linha {
      display: grid;
      grid-template-columns: minmax(110px, 38%) 1fr;
      align-items: center;
      gap: 0.85rem;
      border-radius: 8px;
      outline: none;
    }
    .rotulo {
      font-size: 0.8125rem;
      color: var(--cor-texto-2);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .trilho {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 24px;
      padding-right: 2rem;
      border-left: 1px solid var(--tinta-200);
    }
    .barra {
      height: 14px;
      min-width: 2px;
      border-radius: 0 4px 4px 0;
      background: var(--serie-1);
      transition:
        width 500ms cubic-bezier(0.2, 0.8, 0.2, 1),
        filter var(--transicao);
    }
    .barra.zero {
      background: var(--tinta-200);
    }
    .valor {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--cor-texto);
      font-variant-numeric: tabular-nums;
    }
    .dica {
      position: absolute;
      left: 0;
      bottom: calc(100% + 6px);
      z-index: 5;
      padding: 0.45rem 0.65rem;
      border-radius: 8px;
      background: var(--tinta-900);
      color: var(--tinta-300);
      font-size: 0.75rem;
      white-space: nowrap;
      box-shadow: var(--sombra-md);
      opacity: 0;
      transform: translateY(4px);
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
    .linha:hover .barra,
    .linha:focus-visible .barra {
      filter: brightness(1.12);
    }
    .linha:hover .dica,
    .linha:focus-visible .dica {
      opacity: 1;
      transform: none;
    }
    .linha:focus-visible {
      box-shadow: var(--anel-foco);
    }
  `,
})
export class GraficoBarras {
  readonly titulo = input.required<string>();
  readonly barras = input.required<Barra[]>();
  readonly unidade = input('item');
  readonly unidadePlural = input('itens');

  private readonly maximo = computed(() =>
    Math.max(1, ...this.barras().map((barra) => barra.valor)),
  );
  private readonly total = computed(() =>
    this.barras().reduce((soma, barra) => soma + barra.valor, 0),
  );

  protected largura(valor: number): number {
    return (valor / this.maximo()) * 100;
  }

  protected porcento(valor: number): number {
    return this.total() ? Math.round((valor / this.total()) * 100) : 0;
  }
}
