import { StatusTorneio } from './models/api';

// Regras que o backend também aplica (TorneioService). Usar no painel evita oferecer ações que a API recusaria.

// vagasMax precisa ser uma destas (a chave é eliminatória)
export const VAGAS_PERMITIDAS = [2, 4, 8, 16, 32, 64, 128, 256] as const;

// Mudanças aceitas em PUT /torneios/{id}/status. EM_ANDAMENTO só vem ao gerar a chave
// e FINALIZADO, ao registrar o resultado da final.
export const TRANSICOES_STATUS_TORNEIO: Record<StatusTorneio, StatusTorneio[]> = {
  RASCUNHO: ['INSCRICOES_ABERTAS', 'CANCELADO'],
  INSCRICOES_ABERTAS: ['RASCUNHO', 'INSCRICOES_ENCERRADAS', 'CANCELADO'],
  INSCRICOES_ENCERRADAS: ['INSCRICOES_ABERTAS', 'CANCELADO'],
  EM_ANDAMENTO: ['CANCELADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

// A chave só pode ser gerada com as inscrições encerradas e pelo menos 2 confirmados (check-in)
export const STATUS_PARA_GERAR_CHAVE: StatusTorneio = 'INSCRICOES_ENCERRADAS';
export const MINIMO_CONFIRMADOS_PARA_CHAVE = 2;

// Um torneio finalizado não aceita nenhuma alteração
export function podeAlterarTorneio(status: StatusTorneio): boolean {
  return status !== 'FINALIZADO';
}

// Depois da chave sorteada as inscrições não mudam mais de status (check-in, cancelamento...)
export function podeAlterarInscricoes(status: StatusTorneio): boolean {
  return status !== 'EM_ANDAMENTO' && status !== 'FINALIZADO';
}
