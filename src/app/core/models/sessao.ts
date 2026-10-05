import { LoginResponse, TipoConta } from './api';

// Conta logada no painel: o resumo que vem no login, sem o token.
// Para loja, id é também o id da loja (a loja usa o id da própria conta).
export interface ContaSessao {
  id: number;
  email: string;
  tipo: TipoConta;
  nome: string;
  imagemPerfil?: string;
}

export function contaDaResposta(resposta: LoginResponse): ContaSessao {
  return {
    id: resposta.contaId,
    email: resposta.email,
    tipo: resposta.tipo,
    nome: resposta.nome ?? resposta.email,
    imagemPerfil: resposta.imagemPerfil ?? undefined,
  };
}
