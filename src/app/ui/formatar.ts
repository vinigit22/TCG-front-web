import {
  StatusEvento,
  StatusInscricao,
  StatusPagamento,
  StatusPartida,
  StatusTorneio,
  TipoConta,
} from '../core/models/api';

// Cor do selo (classe .selo-<tom> em styles.css)
export type Tom = 'neutro' | 'roxo' | 'verde' | 'ambar' | 'vermelho' | 'azul';

export const TOM_STATUS_TORNEIO: Record<StatusTorneio, Tom> = {
  RASCUNHO: 'neutro',
  INSCRICOES_ABERTAS: 'verde',
  INSCRICOES_ENCERRADAS: 'ambar',
  EM_ANDAMENTO: 'roxo',
  FINALIZADO: 'azul',
  CANCELADO: 'vermelho',
};

export const TOM_STATUS_INSCRICAO: Record<StatusInscricao, Tom> = {
  INSCRITO: 'roxo',
  LISTA_ESPERA: 'ambar',
  CONFIRMADO: 'verde',
  CANCELADO: 'vermelho',
  NO_SHOW: 'neutro',
};

export const TOM_PAGAMENTO: Record<StatusPagamento, Tom> = {
  PAGO: 'verde',
  PENDENTE: 'ambar',
  ISENTO: 'neutro',
  REEMBOLSADO: 'azul',
};

export const TOM_STATUS_EVENTO: Record<StatusEvento, Tom> = {
  RASCUNHO: 'neutro',
  PUBLICADO: 'verde',
  EM_ANDAMENTO: 'roxo',
  ENCERRADO: 'azul',
  CANCELADO: 'vermelho',
};

export const TOM_STATUS_PARTIDA: Record<StatusPartida, Tom> = {
  AGUARDANDO: 'neutro',
  PRONTA: 'azul',
  EM_ANDAMENTO: 'roxo',
  FINALIZADA: 'verde',
};

export const TOM_TIPO_CONTA: Record<TipoConta, Tom> = {
  LOJA: 'roxo',
  JOGADOR: 'verde',
  ADMIN: 'ambar',
  FUNCIONARIO: 'azul',
};

export const ROTULO_TIPO_CONTA: Record<TipoConta, string> = {
  LOJA: 'Loja',
  JOGADOR: 'Jogador',
  ADMIN: 'Admin',
  FUNCIONARIO: 'Funcionario',
};

// "Card House" -> "CH"; "ericabreu" -> "ER"
export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// A API manda datas sem fuso ("2026-10-18T14:00:00"): o navegador lê como horário local
export function paraData(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

// Valor da API -> <input type="datetime-local"> ("2026-10-18T14:00")
export function paraCampoDataHora(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 16) : '';
}

// <input type="datetime-local"> -> valor da API ("2026-10-18T14:00:00")
export function deCampoDataHora(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return valor.length === 16 ? `${valor}:00` : valor;
}

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

// "há 3 dias", "amanhã", "em 2 horas"
export function tempoRelativo(valor: string | null | undefined, agora = new Date()): string {
  const data = paraData(valor);
  if (!data) return '—';
  const segundos = Math.round((data.getTime() - agora.getTime()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 60) return 'agora';
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  if (abs < 86400 * 30) return relativo.format(Math.round(segundos / 86400), 'day');
  if (abs < 86400 * 365) return relativo.format(Math.round(segundos / (86400 * 30)), 'month');
  return relativo.format(Math.round(segundos / (86400 * 365)), 'year');
}

// Porcentagem para barras e medidores (0 a 100)
export function porcentagem(
  parte: number | null | undefined,
  total: number | null | undefined,
): number {
  if (!total || !parte) return 0;
  return Math.max(0, Math.min(100, Math.round((parte / total) * 100)));
}

// "Pokémon TCG!" -> "pokemon-tcg" (a mesma regra do backend, para mostrar a prévia do endereço)
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

// Busca sem diferenciar maiúsculas nem acentos
export function contem(texto: string | null | undefined, termo: string): boolean {
  if (!termo.trim()) return true;
  const normalizar = (valor: string) => valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return normalizar(texto ?? '').includes(normalizar(termo.trim()));
}
