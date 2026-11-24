import { Routes } from '@angular/router';
import { Seguranca } from '../seguranca/seguranca';
import { Admin } from './admin';
import { Administradores } from './administradores/administradores';
import { Assinaturas } from './assinaturas/assinaturas';
import { AvisosAdmin } from './avisos/avisos-admin';
import { CatalogoAdmin } from './catalogo/catalogo-admin';
import { Contas } from './contas/contas';
import { JogadoresAdmin } from './jogadores/jogadores-admin';
import { LojasAdmin } from './lojas/lojas-admin';
import { Sistema } from './sistema/sistema';
import { TorneiosAdmin } from './torneios/torneios-admin';
import { VisaoGeralAdmin } from './visao-geral/visao-geral-admin';

// Admin geral (/admin): só conta ADMIN entra (tipoContaGuard em app.routes.ts)
export const ROTAS_ADMIN: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      { path: '', component: VisaoGeralAdmin, title: 'Visão geral · Admin TopDeck' },
      { path: 'contas', component: Contas, title: 'Contas · Admin TopDeck' },
      { path: 'lojas', component: LojasAdmin, title: 'Lojas · Admin TopDeck' },
      { path: 'jogadores', component: JogadoresAdmin, title: 'Jogadores · Admin TopDeck' },
      {
        path: 'administradores',
        component: Administradores,
        title: 'Administradores · Admin TopDeck',
      },
      { path: 'torneios', component: TorneiosAdmin, title: 'Torneios · Admin TopDeck' },
      { path: 'catalogo', component: CatalogoAdmin, title: 'Catálogo · Admin TopDeck' },
      {
        path: 'assinaturas',
        component: Assinaturas,
        title: 'Planos e assinaturas · Admin TopDeck',
      },
      { path: 'avisos', component: AvisosAdmin, title: 'Avisos · Admin TopDeck' },
      { path: 'sistema', component: Sistema, title: 'Sistema · Admin TopDeck' },
      { path: 'conta', component: Seguranca, title: 'Segurança · Admin TopDeck' },
      { path: '**', redirectTo: '' },
    ],
  },
];
