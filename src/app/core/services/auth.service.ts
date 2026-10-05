import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, throwError } from 'rxjs';
import { configuracao, urlApi } from '../configuracao';
import { Conta, Loja, LoginRequest, LoginResponse, RegistroLojaRequest } from '../models/api';
import { ContaSessao } from '../models/sessao';
import { SessaoService } from './sessao.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoService);

  // Só contas de loja e de admin entram no painel (configuracao.tiposDeContaPermitidos)
  login(dados: LoginRequest): Observable<ContaSessao> {
    return this.http
      .post<LoginResponse>(urlApi('/auth/login'), dados)
      .pipe(switchMap((resposta) => this.aceitar(resposta)));
  }

  // Cria a conta da loja e já entra com ela
  cadastrarLoja(dados: RegistroLojaRequest): Observable<ContaSessao> {
    return this.http
      .post<LoginResponse>(urlApi('/auth/registro/loja'), dados)
      .pipe(switchMap((resposta) => this.aceitar(resposta)));
  }

  // Encerra o token no backend; a sessão local acaba mesmo se a API não responder
  logout(): Observable<void> {
    return this.http.post<void>(urlApi('/auth/logout'), null).pipe(
      catchError(() => of(undefined)),
      map(() => undefined),
      finalize(() => this.sessao.encerrar()),
    );
  }

  // Confere o token salvo (um 401 encerra a sessão pelo interceptor) e atualiza nome e foto da loja
  recarregarConta(): Observable<ContaSessao | null> {
    if (!this.sessao.autenticado()) return of(null);

    return this.http.get<Conta>(urlApi('/auth/me')).pipe(
      switchMap((conta) =>
        conta.tipo === 'LOJA' ? this.http.get<Loja>(urlApi(`/lojas/${conta.id}`)) : of(null),
      ),
      map((loja) => {
        if (loja) {
          this.sessao.atualizarConta({
            nome: loja.nome,
            imagemPerfil: loja.imagemPerfil ?? undefined,
          });
        }
        return this.sessao.conta();
      }),
    );
  }

  // A API devolve um token novo e invalida os anteriores (inclusive em outros navegadores)
  alterarSenha(senhaAtual: string, novaSenha: string): Observable<ContaSessao> {
    const conta = this.sessao.conta();
    if (!conta) return throwError(() => new Error('Entre na sua conta para alterar a senha.'));

    return this.http
      .put<LoginResponse>(urlApi(`/contas/${conta.id}/senha`), { senhaAtual, novaSenha })
      .pipe(map((resposta) => this.sessao.iniciar(resposta)));
  }

  private aceitar(resposta: LoginResponse): Observable<ContaSessao> {
    if (configuracao.tiposDeContaPermitidos.includes(resposta.tipo)) {
      return of(this.sessao.iniciar(resposta));
    }

    // Conta de jogador: o token recém-emitido é encerrado e o login é recusado
    return this.http
      .post<void>(urlApi('/auth/logout'), null, {
        headers: { Authorization: `Bearer ${resposta.token}` },
      })
      .pipe(
        catchError(() => of(undefined)),
        switchMap(() =>
          throwError(() => new Error('Este painel é das lojas. Jogadores usam o app no celular.')),
        ),
      );
  }
}
