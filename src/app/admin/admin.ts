import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { GrupoMenu, Shell } from '../ui/shell/shell';

// Layout do admin geral (/admin): a equipe TopDeck acompanha contas, lojas, catálogo e a plataforma
@Component({
  selector: 'app-admin',
  imports: [Shell, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell area="Admin" tom="admin" [menu]="menu">
      <router-outlet />
    </app-shell>
  `,
})
export class Admin {
  protected readonly menu: GrupoMenu[] = [
    {
      itens: [{ rotulo: 'Visão geral', rota: '/admin', icone: 'grafico', exato: true }],
    },
    {
      titulo: 'Pessoas',
      itens: [
        { rotulo: 'Contas', rota: '/admin/contas', icone: 'usuario' },
        { rotulo: 'Lojas', rota: '/admin/lojas', icone: 'loja' },
        { rotulo: 'Jogadores', rota: '/admin/jogadores', icone: 'usuarios' },
        { rotulo: 'Administradores', rota: '/admin/administradores', icone: 'escudo' },
      ],
    },
    {
      titulo: 'Plataforma',
      itens: [
        { rotulo: 'Torneios', rota: '/admin/torneios', icone: 'trofeu' },
        { rotulo: 'Catálogo de jogos', rota: '/admin/catalogo', icone: 'grade' },
        { rotulo: 'Planos e assinaturas', rota: '/admin/assinaturas', icone: 'cartao-credito' },
        { rotulo: 'Avisos', rota: '/admin/avisos', icone: 'megafone' },
        { rotulo: 'Sistema', rota: '/admin/sistema', icone: 'servidor' },
      ],
    },
    {
      titulo: 'Conta',
      itens: [{ rotulo: 'Segurança', rota: '/admin/conta', icone: 'cadeado' }],
    },
  ];

  constructor() {
    inject(AuthService)
      .recarregarConta()
      .subscribe({ error: () => undefined });
  }
}
