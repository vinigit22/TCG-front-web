import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from './models/api';

// Mensagem para mostrar ao usuário a partir de um erro da API (corpo ProblemDetail do backend, com a
// mensagem em "detail"), de rede, ou de regra do próprio front (Error com a mensagem pronta).
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e o endereço da API.';
    }

    const corpo = typeof erro.error === 'object' ? (erro.error as ProblemDetail | null) : null;
    const primeiroCampo = corpo?.erros ? Object.entries(corpo.erros)[0] : undefined;
    if (primeiroCampo)
      return `${corpo?.detail ?? 'Dados inválidos'}: ${primeiroCampo[0]} ${primeiroCampo[1]}`;
    if (corpo?.detail) return corpo.detail;

    switch (erro.status) {
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Você não tem permissão para fazer isso.';
      case 404:
        return 'Não encontrado.';
      case 413:
        return 'O arquivo é grande demais.';
      case 429:
        return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
      default:
        return padrao;
    }
  }

  if (erro instanceof Error && erro.message) {
    return erro.message;
  }

  return padrao;
}
