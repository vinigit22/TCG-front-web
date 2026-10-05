import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { configuracao } from '../configuracao';
import { contaDoToken, ErroMock, responderMock } from '../mocks/api-mock';

// Com configuracao.usarMockApi = true, responde as chamadas à API com os dados de exemplo (core/mocks).
// Os services são os mesmos nos dois modos: só o transporte muda.
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!configuracao.usarMockApi || !req.url.startsWith(configuracao.apiUrl)) {
    return next(req);
  }

  const url = new URL(req.urlWithParams);
  try {
    const resposta = responderMock(
      req.method,
      url.pathname,
      url.searchParams,
      req.body,
      contaDoToken(req.headers.get('Authorization')),
    );
    return of(
      new HttpResponse({ status: resposta.status, body: resposta.corpo, url: req.url }),
    ).pipe(delay(150));
  } catch (erro) {
    if (erro instanceof ErroMock) {
      const resposta = new HttpErrorResponse({
        status: erro.status,
        error: erro.corpo,
        url: req.url,
      });
      return throwError(() => resposta);
    }
    throw erro;
  }
};
