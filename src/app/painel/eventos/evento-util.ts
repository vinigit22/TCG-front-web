import { Evento, EventoRequest, StatusEvento, TipoEvento } from '../../core/models/api';
import { NomeIcone } from '../../ui/icone';

// PUT /eventos/{id} substitui o evento inteiro: para mudar só o status, reenvie o resto como está.
// Toda alteração avisa os participantes confirmados.
export function eventoParaRequest(
  evento: Evento,
  mudancas: Partial<EventoRequest> = {},
): EventoRequest {
  return {
    titulo: evento.titulo,
    descricao: evento.descricao,
    imagem: evento.imagem,
    tipo: evento.tipo,
    vagasMax: evento.vagasMax,
    enderecoId: evento.endereco?.id ?? null,
    dataInicio: evento.dataInicio,
    dataFim: evento.dataFim,
    status: evento.status,
    ...mudancas,
  };
}

export const ICONE_TIPO_EVENTO: Record<TipoEvento, NomeIcone> = {
  TROCA: 'cartas',
  CONFRATERNIZACAO: 'usuarios',
  PROMOCAO: 'presente',
  LANCAMENTO: 'raio',
  CASUAL: 'jogar',
  OUTRO: 'estrela',
};

// Mudanças de status oferecidas no painel (o backend aceita qualquer uma)
export const ACOES_EVENTO: Record<
  StatusEvento,
  { destino: StatusEvento; rotulo: string; icone: NomeIcone }[]
> = {
  RASCUNHO: [{ destino: 'PUBLICADO', rotulo: 'Publicar no app', icone: 'megafone' }],
  PUBLICADO: [
    { destino: 'EM_ANDAMENTO', rotulo: 'Começar agora', icone: 'jogar' },
    { destino: 'RASCUNHO', rotulo: 'Voltar para rascunho', icone: 'editar' },
  ],
  EM_ANDAMENTO: [{ destino: 'ENCERRADO', rotulo: 'Encerrar evento', icone: 'bandeira' }],
  ENCERRADO: [],
  CANCELADO: [],
};

// Evento que ainda vai acontecer (ou está acontecendo)
export function eventoFuturo(evento: Evento, agora = Date.now()): boolean {
  const fim = new Date(evento.dataFim ?? evento.dataInicio).getTime();
  return fim >= agora || evento.status === 'EM_ANDAMENTO';
}
