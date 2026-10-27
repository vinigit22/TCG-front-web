import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { logoDoJogo } from '../core/jogos';
import { Jogo } from '../core/models/api';
import { CatalogoService } from '../core/services/catalogo.service';
import { recurso } from '../ui/recurso';

interface CartaoJogo {
  jogo: Jogo;
  logo: string | undefined;
  formatos: string[];
}

// Catálogo de jogos (GET /jogos e /formatos). Jogo ativo leva aos torneios dele; jogo desativado
// pelo admin aparece como "Em breve". Com usarMockApi = true os dados vêm do mock.
@Component({
  selector: 'app-jogos',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './jogos.html',
  styleUrl: './jogos.css',
})
export class Jogos {
  private readonly catalogo = inject(CatalogoService);
  protected readonly jogos = recurso(() => this.catalogo.listarJogos());
  private readonly formatos = recurso(() => this.catalogo.listarFormatos());

  // Ativos primeiro, na ordem do catálogo
  protected readonly cartoes = computed<CartaoJogo[]>(() =>
    (this.jogos.dados() ?? [])
      .map((jogo) => ({
        jogo,
        logo: logoDoJogo(jogo),
        formatos: (this.formatos.dados() ?? [])
          .filter((formato) => formato.jogo.id === jogo.id && formato.ativo)
          .map((formato) => formato.nome),
      }))
      .sort((a, b) => Number(b.jogo.ativo) - Number(a.jogo.ativo)),
  );

  // Jogo sem logo (ex.: Digimon): as iniciais no lugar da imagem
  protected sigla(nome: string): string {
    return nome
      .split(/[\s:]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();
  }
}
