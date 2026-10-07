import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { urlImagem } from '../../core/configuracao';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ContaService } from '../../core/services/conta.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { EstadoVazio } from '../../ui/estado-vazio';
import { contem, iniciais } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';

interface Medalhas {
  ouro: number;
  prata: number;
  bronze: number;
}

@Component({
  selector: 'app-jogadores-admin',
  imports: [DatePipe, Icone, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jogadores-admin.html',
  styleUrl: './jogadores-admin.css',
})
export class JogadoresAdmin {
  private readonly catalogo = inject(CatalogoService);
  private readonly servicoContas = inject(ContaService);
  private readonly servicoResultados = inject(ResultadoService);

  protected readonly jogadores = recurso(() => this.catalogo.listarJogadores());
  private readonly contas = recurso(() => this.servicoContas.listar('JOGADOR'));
  // Pódios de todos os torneios: dá para montar o quadro de medalhas numa chamada só
  private readonly resultados = recurso(() => this.servicoResultados.listar());

  protected readonly busca = signal('');
  protected readonly ordem = signal<'recentes' | 'medalhas' | 'nome'>('recentes');
  protected readonly iniciais = iniciais;

  private readonly medalhas = computed(() => {
    const mapa = new Map<number, Medalhas>();
    for (const resultado of this.resultados.dados() ?? []) {
      const atual = mapa.get(resultado.jogador.contaId) ?? { ouro: 0, prata: 0, bronze: 0 };
      if (resultado.colocacao === 1) atual.ouro++;
      else if (resultado.colocacao === 2) atual.prata++;
      else if (resultado.colocacao === 3) atual.bronze++;
      mapa.set(resultado.jogador.contaId, atual);
    }
    return mapa;
  });

  private readonly contasPorId = computed(
    () => new Map((this.contas.dados() ?? []).map((conta) => [conta.id, conta])),
  );

  protected readonly visiveis = computed(() => {
    const termo = this.busca();
    const linhas = (this.jogadores.dados() ?? [])
      .filter(
        (jogador) =>
          contem(jogador.nome, termo) ||
          contem(jogador.nickname, termo) ||
          contem(jogador.cidade, termo),
      )
      .map((jogador) => ({
        jogador,
        imagem: urlImagem(jogador.imagemPerfil),
        medalhas: this.medalhas().get(jogador.contaId) ?? { ouro: 0, prata: 0, bronze: 0 },
        conta: this.contasPorId().get(jogador.contaId),
      }));
    const pontos = (m: Medalhas) => m.ouro * 100 + m.prata * 10 + m.bronze;
    switch (this.ordem()) {
      case 'medalhas':
        return linhas.sort((a, b) => pontos(b.medalhas) - pontos(a.medalhas));
      case 'nome':
        return linhas.sort((a, b) => a.jogador.nome.localeCompare(b.jogador.nome));
      default:
        return linhas.sort((a, b) => b.jogador.criadoEm.localeCompare(a.jogador.criadoEm));
    }
  });
}
