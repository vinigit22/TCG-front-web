import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

// Páginas do site (home, jogos, preços, login...): cabeçalho, conteúdo e rodapé.
// O painel da loja e o admin têm o próprio layout (ui/shell).
@Component({
  selector: 'app-layout-publico',
  imports: [RouterOutlet, Header, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <main class="conteudo">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .conteudo {
      flex: 1;
    }
  `,
})
export class LayoutPublico {}
