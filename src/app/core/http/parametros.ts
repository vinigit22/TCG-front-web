import { HttpParams } from '@angular/common/http';

type ValorParametro = string | number | boolean | readonly (string | number)[] | null | undefined;

// Monta os filtros de uma consulta: ignora vazios e junta listas por vírgula (?status=A,B), como a API aceita
export function parametros(filtros: Record<string, ValorParametro>): HttpParams {
  let params = new HttpParams();
  for (const [nome, valor] of Object.entries(filtros)) {
    if (valor === null || valor === undefined) continue;
    if (Array.isArray(valor)) {
      if (valor.length > 0) params = params.set(nome, valor.join(','));
    } else {
      params = params.set(nome, String(valor));
    }
  }
  return params;
}
