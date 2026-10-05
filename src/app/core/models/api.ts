// Formato exato do JSON do TCGBackend (respostas e corpos de requisição).
// Datas vêm como "2026-12-20T19:00:00" (sem fuso), valores em reais como número e campos sem valor como null.
// Os mesmos nomes de campo aparecem no app mobile (TCG-front-mobile/src/models/api.ts).

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type TipoConta = 'LOJA' | 'JOGADOR' | 'ADMIN';

export type PapelMembro = 'PROPRIETARIO' | 'ORGANIZADOR' | 'JUIZ';

export type StatusTorneio =
  | 'RASCUNHO'
  | 'INSCRICOES_ABERTAS'
  | 'INSCRICOES_ENCERRADAS'
  | 'EM_ANDAMENTO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type StatusInscricao = 'INSCRITO' | 'LISTA_ESPERA' | 'CONFIRMADO' | 'CANCELADO' | 'NO_SHOW';

export type StatusPagamento = 'ISENTO' | 'PENDENTE' | 'PAGO' | 'REEMBOLSADO';

export type StatusRodada = 'AGUARDANDO' | 'EM_ANDAMENTO' | 'ENCERRADA';

export type StatusPartida = 'AGUARDANDO' | 'PRONTA' | 'EM_ANDAMENTO' | 'FINALIZADA';

export type ResultadoPartida =
  'VITORIA_A' | 'VITORIA_B' | 'EMPATE' | 'WO_A' | 'WO_B' | 'DUPLO_NO_SHOW';

export type ResultadoGame = 'A' | 'B' | 'EMPATE';

export type SlotPartida = 'A' | 'B';

export type StatusEvento = 'RASCUNHO' | 'PUBLICADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'CANCELADO';

export type TipoEvento =
  'TROCA' | 'CONFRATERNIZACAO' | 'PROMOCAO' | 'LANCAMENTO' | 'CASUAL' | 'OUTRO';

export type StatusParticipacao = 'CONFIRMADO' | 'CANCELADO';

export type TipoNotificacao =
  | 'INSCRICAO_CONFIRMADA'
  | 'TORNEIO_INICIADO'
  | 'RODADA_INICIADA'
  | 'PAREAMENTO'
  | 'RESULTADO_REGISTRADO'
  | 'TORNEIO_FINALIZADO'
  | 'EVENTO_ATUALIZADO'
  | 'TORNEIO_CANCELADO'
  | 'AVISO_GERAL';

// ---------------------------------------------------------------------------
// Erros: todas as respostas 4xx/5xx (RFC 9457). A mensagem para o usuário está em "detail".
// Os 401 de rota protegida sem token vêm sem corpo.
// ---------------------------------------------------------------------------

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  // Só nos 400 de validação: campo -> mensagem
  erros?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Contas e autenticação
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  senha: string;
}

// POST /auth/login, POST /auth/registro/loja e PUT /contas/{id}/senha.
// Para loja: contaId = id da loja (a loja usa o id da própria conta); nome = nome da loja; nickname = null.
export interface LoginResponse {
  token: string;
  contaId: number;
  email: string;
  tipo: TipoConta;
  nome: string | null;
  nickname: string | null;
  imagemPerfil: string | null;
}

// POST /auth/registro/loja. Slug vazio = gerado a partir do nome.
export interface RegistroLojaRequest {
  email: string;
  senha: string;
  nome: string;
  slug?: string | null;
  descricao?: string | null;
  imagemPerfil?: string | null;
  imagemBanner?: string | null;
  telefone?: string | null;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

// GET /auth/me e /contas
export interface Conta {
  id: number;
  email: string;
  tipo: TipoConta;
  ativo: boolean;
  emailVerificado: boolean;
  ultimoLogin: string | null;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export interface Jogo {
  id: number;
  nome: string;
  slug: string;
  icone: string | null;
  ativo: boolean;
}

export interface Formato {
  id: number;
  jogo: Jogo;
  nome: string;
  ativo: boolean;
}

export interface Endereco {
  id: number;
  cep: string | null;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
  referencia: string | null;
  criadoEm: string;
}

// POST/PUT /enderecos (cep com 8 dígitos, sem traço; estado com 2 letras)
export interface EnderecoRequest {
  cep?: string | null;
  logradouro: string;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade: string;
  estado: string;
  latitude?: number | null;
  longitude?: number | null;
  referencia?: string | null;
}

// ---------------------------------------------------------------------------
// Lojas e jogadores
// ---------------------------------------------------------------------------

// GET /lojas/{id}. O id da loja é contaId.
export interface Loja {
  contaId: number;
  nome: string;
  slug: string;
  descricao: string | null;
  imagemPerfil: string | null;
  imagemBanner: string | null;
  telefone: string | null;
  endereco: Endereco | null;
  verificada: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// PUT /lojas/{id}. Substitui o perfil inteiro: campo omitido vira null (inclusive o endereço).
export interface LojaRequest {
  nome: string;
  slug?: string | null;
  descricao?: string | null;
  imagemPerfil?: string | null;
  imagemBanner?: string | null;
  telefone?: string | null;
  enderecoId?: number | null;
}

export interface LojaMembro {
  id: number;
  loja: Loja;
  conta: Conta;
  papel: PapelMembro;
  ativo: boolean;
  criadoEm: string;
}

// lojaId e contaId só na criação; na edição mudam papel e ativo
export interface LojaMembroRequest {
  lojaId?: number;
  contaId?: number;
  papel: PapelMembro;
  ativo?: boolean;
}

// GET /lojas/{id}/agenda (eventos e torneios juntos)
export interface AgendaLoja {
  categoria: 'EVENTO' | 'TORNEIO';
  id: number;
  lojaId: number;
  titulo: string;
  imagem: string | null;
  dataInicio: string;
  status: string;
  jogo: string | null;
}

// Perfil público do jogador (sem email e sem data de nascimento)
export interface Jogador {
  contaId: number;
  nome: string;
  nickname: string;
  imagemPerfil: string | null;
  bio: string | null;
  cidade: string | null;
  estado: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

// GET /jogadores/{id}/trofeus
export interface Trofeus {
  jogadorId: number;
  nickname: string;
  nome: string;
  ouro: number;
  prata: number;
  bronze: number;
  torneiosDisputados: number;
}

// ---------------------------------------------------------------------------
// Torneios
// ---------------------------------------------------------------------------

export interface Torneio {
  id: number;
  loja: Loja;
  jogo: Jogo;
  formato: Formato | null;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  // 2, 4, 8, 16, 32, 64, 128 ou 256
  vagasMax: number;
  vagasOcupadas: number | null;
  vagasDisponiveis: number;
  taxaInscricao: number;
  premiacao: string | null;
  // null = o torneio acontece no endereço da loja
  endereco: Endereco | null;
  inscricoesAte: string | null;
  dataInicio: string;
  // Preenchido ao gerar a chave
  totalRodadas: number | null;
  status: StatusTorneio;
  finalizadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

// POST/PUT /torneios. lojaId só na criação; o status muda por PUT /torneios/{id}/status.
export interface TorneioRequest {
  lojaId?: number;
  jogoId: number;
  formatoId?: number | null;
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  vagasMax: number;
  taxaInscricao?: number | null;
  premiacao?: string | null;
  enderecoId?: number | null;
  inscricoesAte?: string | null;
  dataInicio: string;
}

// GET /torneios/{id}/vagas
export interface TorneioVagas {
  torneioId: number;
  titulo: string;
  vagasMax: number;
  inscritos: number;
  vagasRestantes: number;
  listaEspera: number;
  pagamentosPendentes: number;
}

// GET /torneios/{id}/chaveamento (jogadores pelo nickname)
export interface Chaveamento {
  torneioId: number;
  rodada: number;
  nomeRodada: string;
  partidaId: number;
  mesa: number;
  jogadorA: string | null;
  jogadorB: string | null;
  gamesA: number;
  gamesB: number;
  resultado: ResultadoPartida | null;
  vencedor: string | null;
  status: StatusPartida;
}

// ---------------------------------------------------------------------------
// Inscrições
// ---------------------------------------------------------------------------

// GET /inscricoes?torneioId=... (equipe da loja). Exige token.
export interface Inscricao {
  id: number;
  torneio: Torneio;
  jogador: Jogador;
  status: StatusInscricao;
  pagamentoStatus: StatusPagamento;
  seed: number | null;
  inscritoEm: string;
  checkInEm: string | null;
  canceladoEm: string | null;
}

// Criação pela loja: torneioId + jogadorId. Edição pela loja: status, pagamentoStatus e seed.
export interface InscricaoRequest {
  torneioId?: number;
  jogadorId?: number;
  status?: StatusInscricao;
  pagamentoStatus?: StatusPagamento;
  seed?: number;
}

// Inscrição dentro de uma partida: sem o torneio e sem o status de pagamento
export type InscricaoNaPartida = Omit<Inscricao, 'torneio' | 'pagamentoStatus'>;

// ---------------------------------------------------------------------------
// Rodadas, partidas e games
// ---------------------------------------------------------------------------

export interface Rodada {
  id: number;
  torneio: Torneio;
  numero: number;
  nome: string;
  status: StatusRodada;
  iniciadaEm: string | null;
  encerradaEm: string | null;
}

export interface Partida {
  id: number;
  rodada: Rodada;
  mesa: number;
  inscricaoA: InscricaoNaPartida | null;
  inscricaoB: InscricaoNaPartida | null;
  // Partida da rodada seguinte que recebe o vencedor
  proximaPartidaId: number | null;
  proximoSlot: SlotPartida | null;
  status: StatusPartida;
  resultado: ResultadoPartida | null;
  vencedor: InscricaoNaPartida | null;
  gamesA: number;
  gamesB: number;
  gamesEmpate: number;
  observacao: string | null;
  iniciadaEm: string | null;
  finalizadaEm: string | null;
}

// PUT /partidas/{id}. Na chave gerada automaticamente só mesa e observacao podem mudar.
export interface PartidaRequest {
  rodadaId?: number;
  mesa: number;
  inscricaoAId?: number | null;
  inscricaoBId?: number | null;
  proximaPartidaId?: number | null;
  proximoSlot?: SlotPartida | null;
  status?: StatusPartida | null;
  resultado?: ResultadoPartida | null;
  gamesA?: number | null;
  gamesB?: number | null;
  gamesEmpate?: number | null;
  observacao?: string | null;
}

// POST /partidas/{id}/resultado. Se a partida tiver games cadastrados, o placar vem deles.
export interface ResultadoPartidaRequest {
  gamesA?: number;
  gamesB?: number;
  gamesEmpate?: number;
  resultado: ResultadoPartida;
}

// POST /partidas/{id}/desempate
export interface DesempateRequest {
  vencedor: SlotPartida;
}

export interface Game {
  id: number;
  // A partida vem resumida (sem rodada e sem jogadores)
  partida: Pick<
    Partida,
    | 'id'
    | 'mesa'
    | 'proximaPartidaId'
    | 'proximoSlot'
    | 'status'
    | 'resultado'
    | 'gamesA'
    | 'gamesB'
    | 'gamesEmpate'
    | 'observacao'
    | 'iniciadaEm'
    | 'finalizadaEm'
  >;
  numero: number;
  resultado: ResultadoGame;
  duracaoMin: number | null;
}

// numero de 1 a 5; partidaId só na criação
export interface GameRequest {
  partidaId?: number;
  numero: number;
  resultado: ResultadoGame;
  duracaoMin?: number | null;
}

// ---------------------------------------------------------------------------
// Classificação final
// ---------------------------------------------------------------------------

export interface TorneioResultado {
  id: number;
  torneio: Torneio;
  jogador: Jogador;
  // 1 = ouro, 2 = prata, 3 = bronze
  colocacao: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  premioRecebido: string | null;
  registradoEm: string;
}

// torneioId e jogadorId só na criação
export interface TorneioResultadoRequest {
  torneioId?: number;
  jogadorId?: number;
  colocacao: number;
  vitorias?: number;
  derrotas?: number;
  empates?: number;
  premioRecebido?: string | null;
}

// ---------------------------------------------------------------------------
// Eventos (encontros que não são torneio: troca, lançamento...)
// ---------------------------------------------------------------------------

export interface Evento {
  id: number;
  loja: Loja;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  tipo: TipoEvento;
  // null = sem limite
  vagasMax: number | null;
  // null = o evento acontece no endereço da loja
  endereco: Endereco | null;
  dataInicio: string;
  dataFim: string | null;
  status: StatusEvento;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

// lojaId só na criação
export interface EventoRequest {
  lojaId?: number;
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  tipo?: TipoEvento | null;
  vagasMax?: number | null;
  enderecoId?: number | null;
  dataInicio: string;
  dataFim?: string | null;
  status?: StatusEvento | null;
}

export interface EventoParticipacao {
  id: number;
  evento: Evento;
  jogador: Jogador;
  status: StatusParticipacao;
  inscritoEm: string;
  canceladoEm: string | null;
}

// Criação: eventoId (+ jogadorId quando a loja inscreve alguém). Edição: status.
export interface EventoParticipacaoRequest {
  eventoId?: number;
  jogadorId?: number;
  status?: StatusParticipacao;
}

// ---------------------------------------------------------------------------
// Notificações (sempre da conta do token)
// ---------------------------------------------------------------------------

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  torneioId: number | null;
  eventoId: number | null;
  partidaId: number | null;
  lida: boolean;
  lidaEm: string | null;
  criadoEm: string;
}
