import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { configuracao } from '../configuracao';
import { SessaoService } from '../services/sessao.service';

// Envia o token da sessão nas chamadas à API (a não ser que a chamada já traga um Authorization próprio).
// Se a API recusar o token (401: expirou, logout em outro lugar, senha trocada), a sessão local acaba.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(configuracao.apiUrl)) {
    return next(req);
  }

  const sessao = inject(SessaoService);
  const router = inject(Router);
  const token = sessao.token;
  const pedido =
    token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(pedido).pipe(
    catchError((erro) => {
      const caminho = req.url.slice(configuracao.apiUrl.length);
      const rotaDeAutenticacao = caminho.startsWith('/auth/');
      if (
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        pedido.headers.has('Authorization') &&
        !rotaDeAutenticacao
      ) {
        sessao.encerrar();
        router.navigate(['/login']);
      }
      return throwError(() => erro);
    }),
  );
};
