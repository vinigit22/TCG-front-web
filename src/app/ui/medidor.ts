import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { porcentagem } from './formatar';

// Vagas ocupadas / total: trilho verde claro, preenchimento verde; âmbar quando lota
@Component({
  selector: 'app-medidor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="medidor" [class.cheio]="cheio()">
      <div
        class="medidor-trilho"
        role="progressbar"
        aria-valuemin="0"
        [attr.aria-valuemax]="total()"
        [attr.aria-valuenow]="ocupadas()"
        [attr.aria-label]="rotulo()"
      >
        <div class="medidor-preenchimento" [style.width.%]="pct()"></div>
      </div>
      <span class="medidor-texto">{{ ocupadas() }}/{{ total() }}</span>
    </div>
  `,
})
export class Medidor {
  readonly ocupadas = input.required<number>();
  readonly total = input.required<number>();
  readonly rotulo = input('Vagas ocupadas');

  protected readonly pct = computed(() => porcentagem(this.ocupadas(), this.total()));
  protected readonly cheio = computed(() => this.total() > 0 && this.ocupadas() >= this.total());
}
