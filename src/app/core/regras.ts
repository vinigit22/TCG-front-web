import { StatusPagamento, StatusTorneio } from './models/api';

// Regras que o backend também aplica (TorneioService, InscricaoService, ChaveamentoService).
// Usar no painel evita oferecer ações que a API recusaria.

// A plataforma não processa pagamentos: o jogador paga na loja e a equipe marca como pago.
// Só faz check-in (e entra na chave) quem está com o pagamento em dia. Torneio gratuito já nasce ISENTO.
export const PAGAMENTOS_LIBERADOS: StatusPagamento[] = ['PAGO', 'ISENTO'];

export function pagamentoLiberado(status: StatusPagamento): boolean {
  return PAGAMENTOS_LIBERADOS.includes(status);
}

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

// A chave só pode ser gerada com as inscrições encerradas, pelo menos 2 confirmados (check-in)
// e nenhum confirmado com pagamento pendente
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
