import { Routes } from '@angular/router';
import { Seguranca } from '../seguranca/seguranca';
import { Equipe } from './equipe/equipe';
import { DetalheEvento } from './eventos/detalhe-evento';
import { FormEvento } from './eventos/form-evento';
import { ListaEventos } from './eventos/lista-eventos';
import { Notificacoes } from './notificacoes/notificacoes';
import { Painel } from './painel';
import { PerfilLoja } from './perfil-loja/perfil-loja';
import { DetalheTorneio } from './torneios/detalhe-torneio';
import { FormTorneio } from './torneios/form-torneio';
import { ListaTorneios } from './torneios/lista-torneios';
import { VisaoGeral } from './visao-geral/visao-geral';

// Painel da loja (/painel). O app.routes.ts só deixa entrar conta LOJA (tipoContaGuard).
export const ROTAS_PAINEL: Routes = [
  {
    path: '',
    component: Painel,
    children: [
      { path: '', component: VisaoGeral, title: 'Visão geral · Painel da loja' },
      { path: 'torneios', component: ListaTorneios, title: 'Torneios · Painel da loja' },
      { path: 'torneios/novo', component: FormTorneio, title: 'Novo torneio · Painel da loja' },
      { path: 'torneios/:id', component: DetalheTorneio, title: 'Torneio · Painel da loja' },
      {
        path: 'torneios/:id/editar',
        component: FormTorneio,
        title: 'Editar torneio · Painel da loja',
      },
      { path: 'eventos', component: ListaEventos, title: 'Eventos · Painel da loja' },
      { path: 'eventos/novo', component: FormEvento, title: 'Novo evento · Painel da loja' },
      { path: 'eventos/:id', component: DetalheEvento, title: 'Evento · Painel da loja' },
      {
        path: 'eventos/:id/editar',
        component: FormEvento,
        title: 'Editar evento · Painel da loja',
      },
      { path: 'equipe', component: Equipe, title: 'Equipe · Painel da loja' },
      { path: 'loja', component: PerfilLoja, title: 'Perfil da loja · Painel da loja' },
      { path: 'notificacoes', component: Notificacoes, title: 'Notificações · Painel da loja' },
      { path: 'conta', component: Seguranca, title: 'Segurança · Painel da loja' },
      { path: '**', redirectTo: '' },
    ],
  },
];
