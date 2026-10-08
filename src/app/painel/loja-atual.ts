import { inject } from '@angular/core';
import { SessaoService } from '../core/services/sessao.service';

// Para LOJA: id da conta = id da loja.
// Para FUNCIONARIO: lojaId vem da resposta de login (a qual loja pertence).
export function idDaLojaLogada(): number {
  const conta = inject(SessaoService).conta();
  if (!conta) return 0;
  return conta.tipo === 'FUNCIONARIO' ? (conta.lojaId ?? 0) : conta.id;
}
