import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icone, NomeIcone } from './icone';

// Lista vazia ou erro de carregamento, com um texto que diz o que fazer e uma ação opcional (ng-content)
@Component({
  selector: 'app-estado-vazio',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vazio" [class.compacto]="compacto()" [class.erro]="erro()">
      <span class="vazio-icone"
        ><app-icone [nome]="erro() ? 'alerta' : icone()" [tamanho]="22"
      /></span>
      <h3>{{ titulo() }}</h3>
      @if (texto()) {
        <p>{{ texto() }}</p>
      }
      <div class="vazio-acoes"><ng-content /></div>
    </div>
  `,
  styles: `
    .vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.4rem;
      padding: 3rem 1.5rem;
    }
    .vazio.compacto {
      padding: 1.75rem 1rem;
    }
    .vazio-icone {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: 0.5rem;
      border-radius: 14px;
      background: var(--roxo-50);
      color: var(--roxo-600);
      box-shadow: inset 0 0 0 1px var(--roxo-100);
    }
    .erro .vazio-icone {
      background: var(--vermelho-100);
      color: var(--vermelho-700);
      box-shadow: none;
    }
    h3 {
      font-size: 0.95rem;
      font-weight: 700;
    }
    p {
      max-width: 380px;
      font-size: 0.875rem;
      color: var(--cor-texto-3);
    }
    .vazio-acoes:not(:empty) {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.85rem;
    }
  `,
})
export class EstadoVazio {
  readonly titulo = input.required<string>();
  readonly texto = input<string>();
  readonly icone = input<NomeIcone>('cartas');
  readonly erro = input(false);
  readonly compacto = input(false);
}
