import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { Inscricao, StatusInscricao, StatusPagamento } from '../models/api';

// /inscricoes. Não são públicas: a equipe da loja lista as do seu torneio (torneioId).
// Depois que a chave é gerada, nenhuma inscrição muda de status (nem check-in).
@Injectable({ providedIn: 'root' })
export class InscricaoService {
  private readonly http = inject(HttpClient);

  listarDoTorneio(torneioId: number, status?: StatusInscricao): Observable<Inscricao[]> {
    return this.http.get<Inscricao[]>(urlApi('/inscricoes'), {
      params: parametros({ torneioId, status }),
    });
  }

  buscar(id: number): Observable<Inscricao> {
    return this.http.get<Inscricao>(urlApi(`/inscricoes/${id}`));
  }

  // A loja inscreve um jogador (também em RASCUNHO). Sem vaga, ele entra na LISTA_ESPERA.
  inscreverJogador(torneioId: number, jogadorId: number): Observable<Inscricao> {
    return this.http.post<Inscricao>(urlApi('/inscricoes'), { torneioId, jogadorId });
  }

  // Status, pagamento e seed (só o que for informado muda)
  atualizar(
    id: number,
    dados: { status?: StatusInscricao; pagamentoStatus?: StatusPagamento; seed?: number },
  ): Observable<Inscricao> {
    return this.http.put<Inscricao>(urlApi(`/inscricoes/${id}`), dados);
  }

  // No dia do torneio: CONFIRMADO. Só os confirmados entram na chave.
  fazerCheckIn(id: number): Observable<Inscricao> {
    return this.http.put<Inscricao>(urlApi(`/inscricoes/${id}/check-in`), null);
  }

  // Libera a vaga: o primeiro da lista de espera sobe
  cancelar(id: number): Observable<Inscricao> {
    return this.http.put<Inscricao>(urlApi(`/inscricoes/${id}/cancelar`), null);
  }

  // Exclusão definitiva (409 se a inscrição já estiver em alguma partida)
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/inscricoes/${id}`));
  }
}
