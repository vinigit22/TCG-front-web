import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { Notificacao, NotificacaoRequest } from '../models/api';

// /notificacoes: sempre as da conta logada (ex.: "Inscrições encerradas" para a loja fazer o check-in)
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly http = inject(HttpClient);

  // Só o admin: envia uma notificação para uma conta (para avisar várias, uma chamada por conta)
  enviar(dados: NotificacaoRequest): Observable<Notificacao> {
    return this.http.post<Notificacao>(urlApi('/notificacoes'), dados);
  }

  // Mais recentes primeiro
  listar(): Observable<Notificacao[]> {
    return this.http.get<Notificacao[]>(urlApi('/notificacoes'));
  }

  contarNaoLidas(): Observable<number> {
    return this.http.get<number>(urlApi('/notificacoes/nao-lidas/total'));
  }

  marcarComoLida(id: number): Observable<Notificacao> {
    return this.http.put<Notificacao>(urlApi(`/notificacoes/${id}/lida`), null);
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.put<void>(urlApi('/notificacoes/lidas'), null);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/notificacoes/${id}`));
  }
}
