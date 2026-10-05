import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoService } from './services/sessao.service';

// Para as páginas do painel: sem sessão, vai para o login (e volta para a página pedida depois).
// Use com RenderMode.Client em app.routes.server.ts: no servidor não há sessão.
export const autenticadoGuard: CanActivateFn = (_rota, estado) => {
  if (inject(SessaoService).autenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
};
