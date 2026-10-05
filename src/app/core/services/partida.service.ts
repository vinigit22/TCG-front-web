import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import {
  Game,
  GameRequest,
  Partida,
  PartidaRequest,
  ResultadoPartidaRequest,
  Rodada,
  SlotPartida,
} from '../models/api';

// Rodadas, partidas e games. Na chave gerada automaticamente (torneio.totalRodadas preenchido),
// rodadas e partidas não são criadas nem apagadas à mão: o resultado muda por registrarResultado,
// registrarDesempate e reabrir.
@Injectable({ providedIn: 'root' })
export class PartidaService {
  private readonly http = inject(HttpClient);

  listarRodadas(torneioId: number): Observable<Rodada[]> {
    return this.http.get<Rodada[]>(urlApi('/rodadas'), { params: parametros({ torneioId }) });
  }

  listar(filtro: { torneioId?: number; rodadaId?: number }): Observable<Partida[]> {
    return this.http.get<Partida[]>(urlApi('/partidas'), {
      params: parametros({ torneioId: filtro.torneioId, rodadaId: filtro.rodadaId }),
    });
  }

  buscar(id: number): Observable<Partida> {
    return this.http.get<Partida>(urlApi(`/partidas/${id}`));
  }

  // Na chave automática só mesa e observacao mudam
  atualizar(id: number, dados: PartidaRequest): Observable<Partida> {
    return this.http.put<Partida>(urlApi(`/partidas/${id}`), dados);
  }

  // Avança o vencedor; a final encerra o torneio. EMPATE deixa a partida aguardando o desempate.
  registrarResultado(id: number, dados: ResultadoPartidaRequest): Observable<Partida> {
    return this.http.post<Partida>(urlApi(`/partidas/${id}/resultado`), dados);
  }

  registrarDesempate(id: number, vencedor: SlotPartida): Observable<Partida> {
    return this.http.post<Partida>(urlApi(`/partidas/${id}/desempate`), { vencedor });
  }

  // Desfaz o resultado para corrigi-lo, enquanto a partida seguinte não começou
  reabrir(id: number): Observable<Partida> {
    return this.http.post<Partida>(urlApi(`/partidas/${id}/reabrir`), null);
  }

  listarGames(partidaId: number): Observable<Game[]> {
    return this.http.get<Game[]>(urlApi('/games'), { params: parametros({ partidaId }) });
  }

  // Cada game atualiza o placar da partida (gamesA / gamesB / gamesEmpate)
  criarGame(dados: GameRequest): Observable<Game> {
    return this.http.post<Game>(urlApi('/games'), dados);
  }

  atualizarGame(id: number, dados: GameRequest): Observable<Game> {
    return this.http.put<Game>(urlApi(`/games/${id}`), dados);
  }

  excluirGame(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/games/${id}`));
  }
}
