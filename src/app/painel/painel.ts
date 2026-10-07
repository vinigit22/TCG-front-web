import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Icone } from '../ui/icone';
import { GrupoMenu, Shell } from '../ui/shell/shell';
import { ContagemNotificacoes } from './contagem-notificacoes';

// Layout do painel da loja (/painel)
@Component({
  selector: 'app-painel',
  imports: [Shell, RouterOutlet, RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell area="Loja" tom="loja" [menu]="menu()">
      <a
        topo
        routerLink="/painel/notificacoes"
        class="btn btn-fantasma btn-icone sino"
        [attr.aria-label]="naoLidas() ? naoLidas() + ' notificações não lidas' : 'Notificações'"
      >
        <app-icone nome="sino" />
        @if (naoLidas()) {
          <span class="sino-ponto"></span>
        }
      </a>
      <router-outlet />
    </app-shell>
  `,
  styles: `
    .sino {
      position: relative;
    }
    .sino-ponto {
      position: absolute;
      top: 9px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--verde-500);
      box-shadow: 0 0 0 2px var(--cor-pagina);
    }
  `,
})
export class Painel {
  private readonly contagem = inject(ContagemNotificacoes);
  protected readonly naoLidas = this.contagem.total;

  protected readonly menu = computed<GrupoMenu[]>(() => [
    {
      itens: [
        { rotulo: 'Visão geral', rota: '/painel', icone: 'painel', exato: true },
        { rotulo: 'Torneios', rota: '/painel/torneios', icone: 'trofeu' },
        { rotulo: 'Eventos', rota: '/painel/eventos', icone: 'calendario' },
      ],
    },
    {
      titulo: 'Minha loja',
      itens: [
        { rotulo: 'Perfil da loja', rota: '/painel/loja', icone: 'loja' },
        { rotulo: 'Equipe', rota: '/painel/equipe', icone: 'usuarios' },
        {
          rotulo: 'Notificações',
          rota: '/painel/notificacoes',
          icone: 'sino',
          contador: this.naoLidas(),
        },
        { rotulo: 'Segurança', rota: '/painel/conta', icone: 'cadeado' },
      ],
    },
  ]);

  constructor() {
    // Confere o token salvo e atualiza o nome da loja; um 401 leva ao login (authInterceptor)
    inject(AuthService)
      .recarregarConta()
      .subscribe({ error: () => undefined });
    this.contagem.atualizar();
  }
}
