import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import {
  Endereco,
  EnderecoRequest,
  Formato,
  FormatoRequest,
  Jogador,
  Jogo,
  JogoRequest,
  Trofeus,
} from '../models/api';

// Catálogo e cadastros de apoio: jogos, formatos, endereços e jogadores.
// Criar, editar e excluir jogos e formatos é só do admin.
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  // ativo = true: só os jogos que aceitam torneios novos
  listarJogos(ativo?: boolean): Observable<Jogo[]> {
    return this.http.get<Jogo[]>(urlApi('/jogos'), { params: parametros({ ativo }) });
  }

  criarJogo(dados: JogoRequest): Observable<Jogo> {
    return this.http.post<Jogo>(urlApi('/jogos'), dados);
  }

  atualizarJogo(id: number, dados: JogoRequest): Observable<Jogo> {
    return this.http.put<Jogo>(urlApi(`/jogos/${id}`), dados);
  }

  excluirJogo(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/jogos/${id}`));
  }

  listarFormatos(jogoId?: number): Observable<Formato[]> {
    return this.http.get<Formato[]>(urlApi('/formatos'), { params: parametros({ jogoId }) });
  }

  criarFormato(dados: FormatoRequest): Observable<Formato> {
    return this.http.post<Formato>(urlApi('/formatos'), dados);
  }

  atualizarFormato(id: number, dados: FormatoRequest): Observable<Formato> {
    return this.http.put<Formato>(urlApi(`/formatos/${id}`), dados);
  }

  excluirFormato(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/formatos/${id}`));
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

  // Perfis públicos de todos os jogadores
  listarJogadores(): Observable<Jogador[]> {
    return this.http.get<Jogador[]>(urlApi('/jogadores'));
  }

  // Para a loja achar um jogador e inscrevê-lo (perfil público)
  buscarJogadorPorNickname(nickname: string): Observable<Jogador> {
    return this.http.get<Jogador>(urlApi(`/jogadores/nickname/${encodeURIComponent(nickname)}`));
  }

  buscarTrofeus(jogadorId: number): Observable<Trofeus> {
    return this.http.get<Trofeus>(urlApi(`/jogadores/${jogadorId}/trofeus`));
  }
}
