import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Painel da loja e admin geral (com login): renderizados só no navegador,
  // porque a sessão fica no localStorage e não existe no servidor
  { path: 'painel', renderMode: RenderMode.Client },
  { path: 'painel/**', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Páginas públicas: geradas no build
  { path: '**', renderMode: RenderMode.Prerender },
];
