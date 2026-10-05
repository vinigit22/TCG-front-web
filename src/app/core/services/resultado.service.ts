import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { TorneioResultado, TorneioResultadoRequest } from '../models/api';

// /torneio-resultados: classificação final, gerada sozinha ao registrar a final.
// A loja normalmente só completa o prêmio (premioRecebido).
@Injectable({ providedIn: 'root' })
export class ResultadoService {
  private readonly http = inject(HttpClient);

  listarDoTorneio(torneioId: number): Observable<TorneioResultado[]> {
    return this.http.get<TorneioResultado[]>(urlApi('/torneio-resultados'), {
      params: parametros({ torneioId }),
    });
  }

  criar(dados: TorneioResultadoRequest): Observable<TorneioResultado> {
    return this.http.post<TorneioResultado>(urlApi('/torneio-resultados'), dados);
  }

  atualizar(id: number, dados: TorneioResultadoRequest): Observable<TorneioResultado> {
    return this.http.put<TorneioResultado>(urlApi(`/torneio-resultados/${id}`), dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/torneio-resultados/${id}`));
  }
}
