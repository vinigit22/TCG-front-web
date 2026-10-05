import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Jogos } from './jogos/jogos';
import { Home } from './home/home';
import { Quemsomos } from './quemsomos/quemsomos';
import { Preco } from './preco/preco';
import { Torneios } from './torneios/torneios';
import { Cadastro } from './cadastro/cadastro';

// As páginas do painel (depois do login) devem ficar em 'painel/...' com canActivate: [autenticadoGuard]
// (core/autenticado.guard.ts); app.routes.server.ts já as renderiza só no navegador.
export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home,   title: 'Página Inicial'},
    { path: 'jogos', component: Jogos, title: 'Jogos'},
    { path: 'preco', component: Preco, title:'Preço'},
    { path: 'quem-somos', component: Quemsomos, title: 'Quem Somos'},
    { path: 'torneios', component: Torneios, title: 'Torneios'},
    { path: 'login', component: Login, title: 'Login'},
    { path: 'cadastro', component: Cadastro, title: 'Cadastro'},
    { path: '**', redirectTo: 'home'}
];
