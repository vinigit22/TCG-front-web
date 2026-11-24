import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { urlApi } from '../configuracao';
import { Administrador, AdministradorRequest, RegistroAdministradorRequest } from '../models/api';

// /administradores: tudo exige uma conta ADMIN
@Injectable({ providedIn: 'root' })
export class AdministradorService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(urlApi('/administradores'));
  }

  buscar(id: number): Observable<Administrador> {
    return this.http.get<Administrador>(urlApi(`/administradores/${id}`));
  }

  // Cria a conta (tipo ADMIN) e o perfil
  criar(dados: RegistroAdministradorRequest): Observable<Administrador> {
    return this.http.post<Administrador>(urlApi('/administradores'), dados);
  }

  atualizar(id: number, dados: AdministradorRequest): Observable<Administrador> {
    return this.http.put<Administrador>(urlApi(`/administradores/${id}`), dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(urlApi(`/administradores/${id}`));
  }
}
