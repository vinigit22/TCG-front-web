import { urlImagem } from './configuracao';
import { Jogo } from './models/api';

// Logos em public/imagens. Os arquivos jogo1..jogo5 não seguem os ids do backend, então o jogo é
// identificado pelo slug (o mesmo do data.sql). Lorcana ainda não existe no backend; Digimon não tem logo.
const LOGO_POR_SLUG: Record<string, string> = {
  pokemon: '/imagens/jogo1.png',
  yugioh: '/imagens/jogo2.png',
  'one-piece': '/imagens/jogo3.png',
  magic: '/imagens/jogo4.png',
  lorcana: '/imagens/jogo5.png',
};

// O ícone cadastrado no backend tem prioridade sobre o logo local
export function logoDoJogo(jogo: Pick<Jogo, 'slug' | 'icone'>): string | undefined {
  return urlImagem(jogo.icone) ?? LOGO_POR_SLUG[jogo.slug];
}
