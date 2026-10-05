import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { Endereco, EnderecoRequest, Formato, Jogo, Jogador, Trofeus } from '../models/api';

// Consultas de apoio para os formulários do painel: jogos, formatos, endereços e jogadores
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  // ativo = true: só os jogos que aceitam torneios novos
  listarJogos(ativo?: boolean): Observable<Jogo[]> {
    return this.http.get<Jogo[]>(urlApi('/jogos'), { params: parametros({ ativo }) });
  }

  listarFormatos(jogoId?: number): Observable<Formato[]> {
    return this.http.get<Formato[]>(urlApi('/formatos'), { params: parametros({ jogoId }) });
  }

  buscarEndereco(id: number): Observable<Endereco> {
    return this.http.get<Endereco>(urlApi(`/enderecos/${id}`));
  }

  // Lojas, equipes de loja e admin podem criar endereços (para a loja, torneios e eventos)
  criarEndereco(dados: EnderecoRequest): Observable<Endereco> {
    return this.http.post<Endereco>(urlApi('/enderecos'), dados);
  }

  atualizarEndereco(id: number, dados: EnderecoRequest): Observable<Endereco> {
    return this.http.put<Endereco>(urlApi(`/enderecos/${id}`), dados);
  }

  // Para a loja achar um jogador e inscrevê-lo (perfil público)
  buscarJogadorPorNickname(nickname: string): Observable<Jogador> {
    return this.http.get<Jogador>(urlApi(`/jogadores/nickname/${encodeURIComponent(nickname)}`));
  }

  buscarTrofeus(jogadorId: number): Observable<Trofeus> {
    return this.http.get<Trofeus>(urlApi(`/jogadores/${jogadorId}/trofeus`));
  }
}
