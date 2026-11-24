import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import {
  Evento,
  EventoParticipacao,
  EventoRequest,
  StatusEvento,
  StatusParticipacao,
} from '../models/api';

// /eventos e /evento-participacoes (encontros da loja que não são torneio)
@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);

  listar(filtro: { lojaId?: number; status?: StatusEvento } = {}): Observable<Evento[]> {
    return this.http.get<Evento[]>(urlApi('/eventos'), {
      params: parametros({ lojaId: filtro.lojaId, status: filtro.status }),
    });
  }

  buscar(id: number): Observable<Evento> {
    return this.http.get<Evento>(urlApi(`/eventos/${id}`));
  }

  // dados.lojaId é obrigatório na criação
  criar(dados: EventoRequest): Observable<Evento> {
    return this.http.post<Evento>(urlApi('/eventos'), dados);
  }

  // Os participantes confirmados são avisados da alteração
  atualizar(id: number, dados: EventoRequest): Observable<Evento> {
    return this.http.put<Evento>(urlApi(`/eventos/${id}`), dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/eventos/${id}`));
  }

  listarParticipacoes(eventoId: number): Observable<EventoParticipacao[]> {
    return this.http.get<EventoParticipacao[]>(urlApi('/evento-participacoes'), {
      params: parametros({ eventoId }),
    });
  }

  // A loja inscreve um jogador (o evento precisa estar PUBLICADO ou EM_ANDAMENTO)
  inscreverJogador(eventoId: number, jogadorId: number): Observable<EventoParticipacao> {
    return this.http.post<EventoParticipacao>(urlApi('/evento-participacoes'), {
      eventoId,
      jogadorId,
    });
  }

  alterarParticipacao(id: number, status: StatusParticipacao): Observable<EventoParticipacao> {
    return this.http.put<EventoParticipacao>(urlApi(`/evento-participacoes/${id}`), { status });
  }
}
