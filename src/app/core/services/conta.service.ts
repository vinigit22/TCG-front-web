import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { parametros } from '../http/parametros';
import { Conta, TipoConta } from '../models/api';

// /contas. Listar e ativar/desativar são só do admin; excluir vale para a própria conta ou o admin.
@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly http = inject(HttpClient);

  // Sem tipo = todas as contas (as excluídas não aparecem)
  listar(tipo?: TipoConta): Observable<Conta[]> {
    return this.http.get<Conta[]>(urlApi('/contas'), { params: parametros({ tipo }) });
  }

  buscar(id: number): Observable<Conta> {
    return this.http.get<Conta>(urlApi(`/contas/${id}`));
  }

  // Conta inativa não consegue entrar. O admin não pode desativar a própria conta.
  alterarStatus(id: number, ativo: boolean): Observable<Conta> {
    return this.http.put<Conta>(urlApi(`/contas/${id}/status`), { ativo });
  }

  // Exclusão lógica (a conta some das listas e não entra mais)
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/contas/${id}`));
  }
}
