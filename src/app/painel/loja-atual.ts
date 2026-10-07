import { inject } from '@angular/core';
import { SessaoService } from '../core/services/sessao.service';

// Na conta LOJA, o id da conta é o id da loja (/lojas/{id}). O tipoContaGuard garante a sessão.
export function idDaLojaLogada(): number {
  return inject(SessaoService).conta()?.id ?? 0;
}
