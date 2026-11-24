import { LoginResponse, TipoConta } from './api';

// Conta logada no painel: o resumo que vem no login, sem o token.
// Para LOJA: id é também o id da loja (a loja usa o id da própria conta).
// Para FUNCIONARIO: id é o id da conta; lojaId indica o painel a exibir.
export interface ContaSessao {
  id: number;
  email: string;
  tipo: TipoConta;
  nome: string;
  imagemPerfil?: string;
  lojaId?: number;
}

export function contaDaResposta(resposta: LoginResponse): ContaSessao {
  return {
    id: resposta.contaId,
    email: resposta.email,
    tipo: resposta.tipo,
    nome: resposta.nome ?? resposta.email,
    imagemPerfil: resposta.imagemPerfil ?? undefined,
    lojaId: resposta.lojaId ?? undefined,
  };
}
