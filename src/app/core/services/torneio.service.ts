import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { Chaveamento, StatusTorneio, Torneio, TorneioRequest, TorneioVagas } from '../models/api';

export interface FiltroTorneios {
  lojaId?: number;
  jogoId?: number;
  // Vazio = todos os status (inclusive rascunhos e cancelados)
  status?: StatusTorneio[];
}

// /torneios. Alterações exigem a equipe da loja (conta da loja, membro ativo ou admin).
@Injectable({ providedIn: 'root' })
export class TorneioService {
  private readonly http = inject(HttpClient);

  listar(filtro: FiltroTorneios = {}): Observable<Torneio[]> {
    return this.http.get<Torneio[]>(urlApi('/torneios'), {
      params: parametros({ lojaId: filtro.lojaId, jogoId: filtro.jogoId, status: filtro.status }),
    });
  }

  buscar(id: number): Observable<Torneio> {
    return this.http.get<Torneio>(urlApi(`/torneios/${id}`));
  }

  // Nasce em RASCUNHO. dados.lojaId é obrigatório na criação.
  criar(dados: TorneioRequest): Observable<Torneio> {
    return this.http.post<Torneio>(urlApi('/torneios'), dados);
  }

  // Aumentar vagasMax promove quem está na lista de espera
  atualizar(id: number, dados: TorneioRequest): Observable<Torneio> {
    return this.http.put<Torneio>(urlApi(`/torneios/${id}`), dados);
  }

  // Transições válidas em regras.ts (TRANSICOES_STATUS_TORNEIO). EM_ANDAMENTO e FINALIZADO não passam por aqui.
  alterarStatus(id: number, status: StatusTorneio): Observable<Torneio> {
    return this.http.put<Torneio>(urlApi(`/torneios/${id}/status`), { status });
  }

  // Exclusão lógica: o torneio e o que pertence a ele somem da API
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/torneios/${id}`));
  }

  // Sorteia os CONFIRMADOS (exige INSCRICOES_ENCERRADAS) e muda o torneio para EM_ANDAMENTO
  gerarChaveamento(id: number): Observable<Chaveamento[]> {
    return this.http.post<Chaveamento[]>(urlApi(`/torneios/${id}/chaveamento`), null);
  }

  // Lista vazia = a chave ainda não foi gerada
  listarChaveamento(id: number): Observable<Chaveamento[]> {
    return this.http.get<Chaveamento[]>(urlApi(`/torneios/${id}/chaveamento`));
  }

  consultarVagas(id: number): Observable<TorneioVagas> {
    return this.http.get<TorneioVagas>(urlApi(`/torneios/${id}/vagas`));
  }
}
