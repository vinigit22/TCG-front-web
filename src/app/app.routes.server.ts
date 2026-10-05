import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Páginas do painel da loja (com login, autenticadoGuard): renderizadas só no navegador,
  // porque a sessão fica no localStorage e não existe no servidor
  {
    path: 'painel/**',
    renderMode: RenderMode.Client,
  },
  // Páginas públicas: geradas no build
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
