import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Chaveamento } from '../core/models/api';
import { iniciais } from './formatar';
import { Icone } from './icone';

interface RodadaVisual {
  numero: number;
  nome: string;
  partidas: Chaveamento[];
}

// Partida empatada que ainda espera o desempate (a chave precisa de um vencedor)
export function aguardaDesempate(partida: Chaveamento): boolean {
  return partida.resultado === 'EMPATE' && partida.status !== 'FINALIZADA';
}

// Lado sem jogador numa partida já decidida = bye (avançou sem adversário)
export function ehBye(partida: Chaveamento): boolean {
  return partida.status === 'FINALIZADA' && (!partida.jogadorA || !partida.jogadorB);
}

// Chave eliminatória desenhada a partir de GET /torneios/{id}/chaveamento (uma coluna por rodada)
@Component({
  selector: 'app-chave-visual',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chave-visual.html',
  styleUrl: './chave-visual.css',
})
export class ChaveVisual {
  readonly linhas = input.required<Chaveamento[]>();
  // true: as partidas viram botões (a loja registra resultados)
  readonly interativa = input(false);
  readonly selecionar = output<Chaveamento>();

  protected readonly iniciais = iniciais;
  protected readonly ehBye = ehBye;

  protected readonly rodadas = computed<RodadaVisual[]>(() => {
    const porRodada = new Map<number, RodadaVisual>();
    for (const linha of this.linhas()) {
      const rodada = porRodada.get(linha.rodada) ?? {
        numero: linha.rodada,
        nome: linha.nomeRodada,
        partidas: [],
      };
      rodada.partidas.push(linha);
      porRodada.set(linha.rodada, rodada);
    }
    return [...porRodada.values()]
      .sort((a, b) => a.numero - b.numero)
      .map((rodada) => ({
        ...rodada,
        partidas: [...rodada.partidas].sort((a, b) => a.mesa - b.mesa),
      }));
  });

  protected estado(partida: Chaveamento): string {
    if (aguardaDesempate(partida)) return 'Desempate';
    if (ehBye(partida)) return 'Bye';
    switch (partida.status) {
      case 'AGUARDANDO':
        return 'Aguardando';
      case 'PRONTA':
        return 'Pronta';
      case 'EM_ANDAMENTO':
        return 'Ao vivo';
      case 'FINALIZADA':
        return partida.resultado === 'WO_A' || partida.resultado === 'WO_B' ? 'W.O.' : 'Encerrada';
    }
  }

  protected classeEstado(partida: Chaveamento): string {
    if (aguardaDesempate(partida)) return 'desempate';
    return partida.status.toLowerCase();
  }

  protected venceu(partida: Chaveamento, jogador: string | null): boolean {
    return !!jogador && partida.vencedor === jogador;
  }

  protected perdeu(partida: Chaveamento, jogador: string | null): boolean {
    return !!jogador && !!partida.vencedor && partida.vencedor !== jogador;
  }

  protected descricao(partida: Chaveamento): string {
    const a = partida.jogadorA ?? 'a definir';
    const b = partida.jogadorB ?? 'a definir';
    return `Mesa ${partida.mesa}: ${a} contra ${b}, ${partida.gamesA} a ${partida.gamesB}. ${this.estado(partida)}`;
  }
}
