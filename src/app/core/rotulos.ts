import {
  PapelMembro,
  ResultadoPartida,
  StatusEvento,
  StatusInscricao,
  StatusPagamento,
  StatusPartida,
  StatusRodada,
  StatusTorneio,
  TipoEvento,
} from './models/api';

// Textos para mostrar os valores dos enums da API

export const ROTULOS_STATUS_TORNEIO: Record<StatusTorneio, string> = {
  RASCUNHO: 'Rascunho',
  INSCRICOES_ABERTAS: 'Inscrições abertas',
  INSCRICOES_ENCERRADAS: 'Inscrições encerradas',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const ROTULOS_STATUS_INSCRICAO: Record<StatusInscricao, string> = {
  INSCRITO: 'Inscrito',
  LISTA_ESPERA: 'Lista de espera',
  CONFIRMADO: 'Confirmado (check-in)',
  CANCELADO: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

export const ROTULOS_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  ISENTO: 'Isento',
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  REEMBOLSADO: 'Reembolsado',
};

export const ROTULOS_STATUS_RODADA: Record<StatusRodada, string> = {
  AGUARDANDO: 'Aguardando',
  EM_ANDAMENTO: 'Em andamento',
  ENCERRADA: 'Encerrada',
};

export const ROTULOS_STATUS_PARTIDA: Record<StatusPartida, string> = {
  AGUARDANDO: 'Aguardando jogadores',
  PRONTA: 'Pronta',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
};

export const ROTULOS_RESULTADO_PARTIDA: Record<ResultadoPartida, string> = {
  VITORIA_A: 'Vitória do jogador A',
  VITORIA_B: 'Vitória do jogador B',
  EMPATE: 'Empate',
  WO_A: 'W.O. para o jogador A',
  WO_B: 'W.O. para o jogador B',
  DUPLO_NO_SHOW: 'Nenhum dos dois compareceu',
};

export const ROTULOS_STATUS_EVENTO: Record<StatusEvento, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  EM_ANDAMENTO: 'Em andamento',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
};

export const ROTULOS_TIPO_EVENTO: Record<TipoEvento, string> = {
  TROCA: 'Troca de cartas',
  CONFRATERNIZACAO: 'Confraternização',
  PROMOCAO: 'Promoção',
  LANCAMENTO: 'Lançamento',
  CASUAL: 'Casual',
  OUTRO: 'Outro',
};

export const ROTULOS_PAPEL_MEMBRO: Record<PapelMembro, string> = {
  PROPRIETARIO: 'Proprietário',
  ORGANIZADOR: 'Organizador',
  JUIZ: 'Juiz',
};
