import {
  AgendaLoja,
  Conta,
  Endereco,
  Evento,
  Formato,
  Inscricao,
  Jogador,
  Jogo,
  Loja,
  LojaMembro,
  Notificacao,
  Torneio,
  TorneioVagas,
} from '../models/api';

// Os mesmos dados de teste do backend (TCGBackend/src/main/resources/h2/data.sql), no formato do JSON da API.
// O torneio 1 aparece com as inscrições já encerradas, como fica depois que o agendador do backend roda.

const CRIADO_EM = '2026-10-05T09:00:00';

function conta(id: number, email: string, tipo: Conta['tipo']): Conta {
  return {
    id,
    email,
    tipo,
    ativo: true,
    emailVerificado: true,
    ultimoLogin: null,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
    deletadoEm: null,
  };
}

export const contas: Conta[] = [
  conta(1, 'contato@cardhouse.com.br', 'LOJA'),
  conta(2, 'eric@email.com', 'JOGADOR'),
  conta(3, 'samuel@email.com', 'JOGADOR'),
  conta(4, 'vinicius@email.com', 'JOGADOR'),
  conta(5, 'lucas@email.com', 'JOGADOR'),
  conta(6, 'admin@tcg.com', 'ADMIN'),
];

// Senhas das contas de teste (as mesmas do backend no perfil H2)
export const senhas: Record<string, string> = {
  'contato@cardhouse.com.br': '123456',
  'eric@email.com': '123456',
  'samuel@email.com': '123456',
  'vinicius@email.com': '123456',
  'lucas@email.com': '123456',
  'admin@tcg.com': 'admin123',
};

// Nome que acompanha o login de cada conta (loja, jogadores e admin)
export const nomesDasContas: Record<number, { nome: string; nickname: string | null }> = {
  1: { nome: 'Card House', nickname: null },
  2: { nome: 'Eric Abreu', nickname: 'ericabreu' },
  3: { nome: 'Samuel Barbosa', nickname: 'sambarbosa' },
  4: { nome: 'Vinicius Marques', nickname: 'vinimarques' },
  5: { nome: 'Lucas Souza', nickname: 'lucassz' },
  6: { nome: 'Administrador', nickname: null },
};

export const jogos: Jogo[] = [
  { id: 1, nome: 'Magic: The Gathering', slug: 'magic', icone: null, ativo: true },
  { id: 2, nome: 'Pokemon TCG', slug: 'pokemon', icone: null, ativo: true },
  { id: 3, nome: 'Yu-Gi-Oh!', slug: 'yugioh', icone: null, ativo: true },
  { id: 4, nome: 'One Piece Card Game', slug: 'one-piece', icone: null, ativo: true },
  { id: 5, nome: 'Digimon Card Game', slug: 'digimon', icone: null, ativo: true },
];

function formato(id: number, jogoId: number, nome: string): Formato {
  return { id, jogo: jogos[jogoId - 1], nome, ativo: true };
}

export const formatos: Formato[] = [
  formato(1, 1, 'Standard'),
  formato(2, 1, 'Modern'),
  formato(3, 1, 'Commander'),
  formato(4, 1, 'Pauper'),
  formato(5, 2, 'Standard'),
  formato(6, 2, 'Expandido'),
  formato(7, 3, 'Advanced'),
  formato(8, 4, 'Standard'),
];

export const enderecos: Endereco[] = [
  {
    id: 1,
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: null,
    bairro: 'Bela Vista',
    cidade: 'Sao Paulo',
    estado: 'SP',
    latitude: -23.5632,
    longitude: -46.6543,
    referencia: null,
    criadoEm: CRIADO_EM,
  },
];

export const lojas: Loja[] = [
  {
    contaId: 1,
    nome: 'Card House',
    slug: 'card-house',
    descricao: 'Loja especializada em card games na regiao central de Sao Paulo.',
    imagemPerfil: null,
    imagemBanner: null,
    telefone: null,
    endereco: enderecos[0],
    verificada: false,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
  },
];

function jogador(contaId: number, cidade: string): Jogador {
  return {
    contaId,
    nome: nomesDasContas[contaId].nome,
    nickname: nomesDasContas[contaId].nickname ?? '',
    imagemPerfil: null,
    bio: null,
    cidade,
    estado: 'SP',
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
  };
}

export const jogadores: Jogador[] = [
  jogador(2, 'Sao Paulo'),
  jogador(3, 'Sao Paulo'),
  jogador(4, 'Sao Paulo'),
  jogador(5, 'Guarulhos'),
];

export const lojaMembros: LojaMembro[] = [
  {
    id: 1,
    loja: lojas[0],
    conta: contas[0],
    papel: 'PROPRIETARIO',
    ativo: true,
    criadoEm: CRIADO_EM,
  },
];

export const torneios: Torneio[] = [
  {
    id: 1,
    loja: lojas[0],
    jogo: jogos[0],
    formato: formatos[0],
    titulo: 'Standard Semanal',
    descricao: 'Torneio semanal de Magic, formato Standard, melhor de 3.',
    imagem: null,
    vagasMax: 4,
    vagasOcupadas: 4,
    vagasDisponiveis: 0,
    taxaInscricao: 25,
    premiacao: 'R$ 200 em creditos + 3 boosters para o campeao',
    endereco: null,
    inscricoesAte: '2026-09-05T18:00:00',
    dataInicio: '2026-09-05T19:00:00',
    totalRodadas: null,
    status: 'INSCRICOES_ENCERRADAS',
    finalizadoEm: null,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
    deletadoEm: null,
  },
];

export const inscricoes: Inscricao[] = jogadores.map((jogadorInscrito, indice) => ({
  id: indice + 1,
  torneio: torneios[0],
  jogador: jogadorInscrito,
  status: 'CONFIRMADO',
  pagamentoStatus: 'PAGO',
  seed: null,
  inscritoEm: CRIADO_EM,
  checkInEm: CRIADO_EM,
  canceladoEm: null,
}));

export const vagasDosTorneios: TorneioVagas[] = [
  {
    torneioId: 1,
    titulo: 'Standard Semanal',
    vagasMax: 4,
    inscritos: 4,
    vagasRestantes: 0,
    listaEspera: 0,
    pagamentosPendentes: 0,
  },
];

export const eventos: Evento[] = [
  {
    id: 1,
    loja: lojas[0],
    titulo: 'Dia da Troca',
    descricao: 'Encontro livre para troca de cartas entre colecionadores.',
    imagem: null,
    tipo: 'TROCA',
    vagasMax: 40,
    endereco: null,
    dataInicio: '2026-09-12T14:00:00',
    dataFim: null,
    status: 'PUBLICADO',
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
    deletadoEm: null,
  },
];

export const agendas: Record<number, AgendaLoja[]> = {
  1: [
    {
      categoria: 'TORNEIO',
      id: 1,
      lojaId: 1,
      titulo: 'Standard Semanal',
      imagem: null,
      dataInicio: '2026-09-05T19:00:00',
      status: 'INSCRICOES_ENCERRADAS',
      jogo: 'Magic: The Gathering',
    },
    {
      categoria: 'EVENTO',
      id: 1,
      lojaId: 1,
      titulo: 'Dia da Troca',
      imagem: null,
      dataInicio: '2026-09-12T14:00:00',
      status: 'PUBLICADO',
      jogo: null,
    },
  ],
};

// Notificações por conta. A loja recebe o aviso do agendador quando o prazo de inscrição acaba.
export const notificacoes: Record<number, Notificacao[]> = {
  1: [
    {
      id: 1,
      tipo: 'AVISO_GERAL',
      titulo: 'Inscrições encerradas',
      mensagem:
        "O prazo de inscrição do torneio 'Standard Semanal' terminou. Faça o check-in dos jogadores e gere a chave.",
      torneioId: 1,
      eventoId: null,
      partidaId: null,
      lida: false,
      lidaEm: null,
      criadoEm: CRIADO_EM,
    },
  ],
};
