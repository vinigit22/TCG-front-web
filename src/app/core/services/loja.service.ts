import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { AgendaLoja, Loja, LojaMembro, LojaMembroRequest, LojaRequest } from '../models/api';

// /lojas e /loja-membros. O id da loja é o id da conta da loja (ContaSessao.id quando a loja está logada).
@Injectable({ providedIn: 'root' })
export class LojaService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Loja[]> {
    return this.http.get<Loja[]>(urlApi('/lojas'));
  }

  buscar(id: number): Observable<Loja> {
    return this.http.get<Loja>(urlApi(`/lojas/${id}`));
  }

  buscarPorSlug(slug: string): Observable<Loja> {
    return this.http.get<Loja>(urlApi(`/lojas/slug/${encodeURIComponent(slug)}`));
  }

  // Substitui o perfil inteiro: mande todos os campos, inclusive enderecoId (omitido = sem endereço)
  atualizar(id: number, dados: LojaRequest): Observable<Loja> {
    return this.http.put<Loja>(urlApi(`/lojas/${id}`), dados);
  }

  // Só o admin: o selo de loja verificada aparece para os jogadores
  alterarVerificacao(id: number, verificada: boolean): Observable<Loja> {
    return this.http.put<Loja>(urlApi(`/lojas/${id}/verificacao`), { verificada });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/lojas/${id}`));
  }

  // Eventos e torneios da loja, por data
  listarAgenda(id: number): Observable<AgendaLoja[]> {
    return this.http.get<AgendaLoja[]>(urlApi(`/lojas/${id}/agenda`));
  }

  listarMembros(lojaId: number): Observable<LojaMembro[]> {
    return this.http.get<LojaMembro[]>(urlApi('/loja-membros'), { params: parametros({ lojaId }) });
  }

  // Só o proprietário. dados.lojaId e dados.contaId são obrigatórios.
  adicionarMembro(dados: LojaMembroRequest): Observable<LojaMembro> {
    return this.http.post<LojaMembro>(urlApi('/loja-membros'), dados);
  }

  atualizarMembro(id: number, dados: LojaMembroRequest): Observable<LojaMembro> {
    return this.http.put<LojaMembro>(urlApi(`/loja-membros/${id}`), dados);
  }

  removerMembro(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/loja-membros/${id}`));
  }
}
