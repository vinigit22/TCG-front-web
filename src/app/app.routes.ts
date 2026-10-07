import { Routes } from '@angular/router';
import { Cadastro } from './cadastro/cadastro';
import { tipoContaGuard } from './core/autenticado.guard';
import { Home } from './home/home';
import { Jogos } from './jogos/jogos';
import { LayoutPublico } from './layout-publico/layout-publico';
import { Login } from './login/login';
import { Preco } from './preco/preco';
import { Quemsomos } from './quemsomos/quemsomos';
import { Torneios } from './torneios/torneios';

// Três áreas: o site (público), o painel da loja (/painel, conta LOJA) e o admin geral (/admin, conta ADMIN).
// Os painéis são carregados sob demanda e renderizados só no navegador (app.routes.server.ts).
export const routes: Routes = [
  {
    path: '',
    component: LayoutPublico,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home, title: 'TopDeck · Torneios de card game' },
      { path: 'jogos', component: Jogos, title: 'Jogos · TopDeck' },
      { path: 'preco', component: Preco, title: 'Planos · TopDeck' },
      { path: 'quem-somos', component: Quemsomos, title: 'Quem somos · TopDeck' },
      { path: 'torneios', component: Torneios, title: 'Torneios · TopDeck' },
      { path: 'login', component: Login, title: 'Entrar · TopDeck' },
      { path: 'cadastro', component: Cadastro, title: 'Cadastre sua loja · TopDeck' },
    ],
  },
  {
    path: 'painel',
    canActivate: [tipoContaGuard('LOJA')],
    loadChildren: () => import('./painel/painel.routes').then((m) => m.ROTAS_PAINEL),
  },
  {
    path: 'admin',
    canActivate: [tipoContaGuard('ADMIN')],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ROTAS_ADMIN),
  },
  { path: '**', redirectTo: 'home' },
];
