// Planos oferecidos às lojas. A página pública de preços e a tela de assinaturas do admin usam esta lista.
// O TCGBackend ainda não tem planos nem assinaturas: quando tiver, troque por GET /planos.

export type IdPlano = 'GRATUITO' | 'PRO';

export interface Plano {
  id: IdPlano;
  nome: string;
  precoMensal: number;
  destaque?: string;
  recursos: string[];
}

export const PLANOS: Plano[] = [
  {
    id: 'GRATUITO',
    nome: 'Gratuito',
    precoMensal: 0,
    recursos: [
      '1 torneio ativo',
      'Até 16 jogadores',
      'Chaveamento automático',
      'Relatórios básicos',
    ],
  },
  {
    id: 'PRO',
    nome: 'Pro',
    precoMensal: 49,
    destaque: 'Popular',
    recursos: [
      'Torneios ilimitados',
      'Até 256 jogadores',
      'Chaveamento automático',
      'Eventos e trocas',
      'Relatórios completos',
      'Suporte prioritário',
    ],
  },
];
