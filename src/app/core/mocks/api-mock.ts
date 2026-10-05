import { LoginResponse, ProblemDetail } from '../models/api';
import * as dados from './dados-exemplo';

// Respostas do modo mock (configuracao.usarMockApi): as consultas e o login devolvem os dados de exemplo
// no mesmo formato da API. Não confere permissões além de exigir login nas rotas protegidas, e não
// simula alterações: criar, editar e excluir respondem 503 pedindo a API real.

export interface RespostaMock {
  status: number;
  corpo: unknown;
}

export class ErroMock extends Error {
  constructor(
    readonly status: number,
    readonly corpo: ProblemDetail | null,
  ) {
    super(corpo?.detail ?? `Erro ${status}`);
  }
}

const PREFIXO_TOKEN = 'mock.';

function problema(status: number, detail: string): ErroMock {
  return new ErroMock(status, { status, title: 'Erro', detail });
}

// Igual ao backend: rota protegida sem token responde 401 sem corpo
function exigirLogin(contaId: number | null): number {
  if (contaId === null) throw new ErroMock(401, null);
  return contaId;
}

function copia<T>(valor: T): T {
  return structuredClone(valor);
}

function numero(valor: string | null): number | undefined {
  return valor === null ? undefined : Number(valor);
}

export function contaDoToken(authorization: string | null): number | null {
  const token = authorization?.replace(/^Bearer /, '');
  if (!token?.startsWith(PREFIXO_TOKEN)) return null;
  const id = Number(token.slice(PREFIXO_TOKEN.length));
  return dados.contas.some((conta) => conta.id === id) ? id : null;
}

export function responderMock(
  metodo: string,
  caminho: string,
  params: URLSearchParams,
  corpo: unknown,
  contaId: number | null,
): RespostaMock {
  if (metodo === 'POST' && caminho === '/auth/login') {
    return { status: 200, corpo: login(corpo as { email?: string; senha?: string }) };
  }
  if (metodo === 'POST' && caminho === '/auth/logout') {
    return { status: 204, corpo: null };
  }
  if (metodo !== 'GET') {
    throw problema(
      503,
      'Modo de demonstração: esta ação precisa da API. Em core/configuracao.ts, mude usarMockApi para false e suba o TCGBackend.',
    );
  }
  return { status: 200, corpo: copia(consultar(caminho, params, contaId)) };
}

function login(corpo: { email?: string; senha?: string }): LoginResponse {
  const email = (corpo?.email ?? '').trim().toLowerCase();
  const conta = dados.contas.find((item) => item.email === email);
  if (!conta || dados.senhas[email] !== corpo?.senha) {
    throw problema(401, 'Email ou senha inválidos');
  }
  const perfil = dados.nomesDasContas[conta.id];
  return {
    token: PREFIXO_TOKEN + conta.id,
    contaId: conta.id,
    email: conta.email,
    tipo: conta.tipo,
    nome: perfil.nome,
    nickname: perfil.nickname,
    imagemPerfil: null,
  };
}

function consultar(caminho: string, params: URLSearchParams, contaId: number | null): unknown {
  const partes = caminho.split('/').filter(Boolean);
  const [recurso, id, sub] = partes;
  const idNumero = id !== undefined ? Number(id) : undefined;

  switch (recurso) {
    case 'auth':
      if (id === 'me') {
        const logada = exigirLogin(contaId);
        return dados.contas.find((conta) => conta.id === logada);
      }
      break;

    case 'jogos': {
      if (idNumero !== undefined)
        return dados.jogos.find((jogo) => jogo.id === idNumero) ?? erro404();
      const ativo = params.get('ativo');
      return ativo === null
        ? dados.jogos
        : dados.jogos.filter((jogo) => String(jogo.ativo) === ativo);
    }

    case 'formatos': {
      if (idNumero !== undefined)
        return dados.formatos.find((item) => item.id === idNumero) ?? erro404();
      const jogoId = numero(params.get('jogoId'));
      return jogoId === undefined
        ? dados.formatos
        : dados.formatos.filter((item) => item.jogo.id === jogoId);
    }

    case 'enderecos':
      if (idNumero !== undefined)
        return dados.enderecos.find((item) => item.id === idNumero) ?? erro404();
      return dados.enderecos;

    case 'lojas': {
      if (id === undefined) return dados.lojas;
      if (id === 'slug') return dados.lojas.find((loja) => loja.slug === sub) ?? erro404();
      const loja = dados.lojas.find((item) => item.contaId === idNumero) ?? erro404();
      if (sub === 'agenda') return dados.agendas[loja.contaId] ?? [];
      return loja;
    }

    case 'loja-membros': {
      exigirLogin(contaId);
      const lojaId = numero(params.get('lojaId'));
      return lojaId === undefined
        ? dados.lojaMembros
        : dados.lojaMembros.filter((membro) => membro.loja.contaId === lojaId);
    }

    case 'jogadores': {
      if (id === undefined) return dados.jogadores;
      if (id === 'nickname')
        return dados.jogadores.find((item) => item.nickname === sub) ?? erro404();
      const jogador = dados.jogadores.find((item) => item.contaId === idNumero) ?? erro404();
      if (sub === 'trofeus') {
        return {
          jogadorId: jogador.contaId,
          nickname: jogador.nickname,
          nome: jogador.nome,
          ouro: 0,
          prata: 0,
          bronze: 0,
          torneiosDisputados: 0,
        };
      }
      return jogador;
    }

    case 'torneios': {
      if (id === undefined) {
        const lojaId = numero(params.get('lojaId'));
        const jogoId = numero(params.get('jogoId'));
        const status = params.get('status')?.split(',').filter(Boolean) ?? [];
        return dados.torneios.filter(
          (torneio) =>
            (lojaId === undefined || torneio.loja.contaId === lojaId) &&
            (jogoId === undefined || torneio.jogo.id === jogoId) &&
            (status.length === 0 || status.includes(torneio.status)),
        );
      }
      const torneio = dados.torneios.find((item) => item.id === idNumero) ?? erro404();
      if (sub === 'vagas')
        return dados.vagasDosTorneios.find((item) => item.torneioId === torneio.id);
      if (sub === 'chaveamento') return [];
      return torneio;
    }

    case 'inscricoes': {
      exigirLogin(contaId);
      if (idNumero !== undefined)
        return dados.inscricoes.find((item) => item.id === idNumero) ?? erro404();
      const torneioId = numero(params.get('torneioId'));
      const jogadorId = numero(params.get('jogadorId'));
      const status = params.get('status');
      return dados.inscricoes.filter(
        (inscricao) =>
          (torneioId === undefined || inscricao.torneio.id === torneioId) &&
          (jogadorId === undefined || inscricao.jogador.contaId === jogadorId) &&
          (status === null || inscricao.status === status),
      );
    }

    // A chave do torneio de exemplo ainda não foi gerada
    case 'rodadas':
    case 'partidas':
    case 'games':
    case 'torneio-resultados':
    case 'evento-participacoes':
      if (idNumero !== undefined) erro404();
      return [];

    case 'eventos': {
      if (idNumero !== undefined)
        return dados.eventos.find((item) => item.id === idNumero) ?? erro404();
      const lojaId = numero(params.get('lojaId'));
      const status = params.get('status');
      return dados.eventos.filter(
        (evento) =>
          (lojaId === undefined || evento.loja.contaId === lojaId) &&
          (status === null || evento.status === status),
      );
    }

    case 'notificacoes': {
      const logada = exigirLogin(contaId);
      const daConta = dados.notificacoes[logada] ?? [];
      if (id === 'nao-lidas') {
        const naoLidas = daConta.filter((notificacao) => !notificacao.lida);
        return sub === 'total' ? naoLidas.length : naoLidas;
      }
      if (idNumero !== undefined) return daConta.find((item) => item.id === idNumero) ?? erro404();
      return daConta;
    }
  }

  throw problema(404, `Rota não simulada no modo mock: GET ${caminho}`);
}

function erro404(): never {
  throw problema(404, 'Não encontrado');
}
