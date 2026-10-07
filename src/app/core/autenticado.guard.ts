import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TipoConta } from './models/api';
import { SessaoService } from './services/sessao.service';

// Página inicial de cada tipo de conta depois do login
export function areaDaConta(tipo: TipoConta): string {
  if (tipo === 'ADMIN') return '/admin';
  if (tipo === 'LOJA') return '/painel';
  return '/';
}

// Para as páginas do painel: sem sessão, vai para o login (e volta para a página pedida depois).
// Use com RenderMode.Client em app.routes.server.ts: no servidor não há sessão.
export const autenticadoGuard: CanActivateFn = (_rota, estado) => {
  if (inject(SessaoService).autenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
};

// Área de um tipo de conta (painel da loja, admin geral). Logado com outro tipo: vai para a própria área.
export function tipoContaGuard(...tipos: TipoConta[]): CanActivateFn {
  return (_rota, estado) => {
    const router = inject(Router);
    const conta = inject(SessaoService).conta();
    if (!conta) {
      return router.createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
    }
    return tipos.includes(conta.tipo) ? true : router.parseUrl(areaDaConta(conta.tipo));
  };
}
