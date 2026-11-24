import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemDeErro } from '../core/erros';
import { urlImagem } from '../core/configuracao';
import { Jogador } from '../core/models/api';
import { CatalogoService } from '../core/services/catalogo.service';
import { iniciais } from './formatar';
import { Icone } from './icone';
import { Modal } from './modal';

// Acha um jogador pelo nickname (perfil público) e devolve em (escolher).
// O componente pai faz a ação (inscrever, adicionar à equipe...) e fecha a janela.
@Component({
  selector: 'app-buscar-jogador',
  imports: [FormsModule, Modal, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [(aberto)]="aberto" [titulo]="titulo()" [descricao]="descricao()">
      <form class="busca" (ngSubmit)="buscar()">
        <label class="campo">
          <span class="campo-rotulo">Nickname do jogador</span>
          <div class="controle-grupo">
            <span class="controle-prefixo">&#64;</span>
            <input
              class="controle"
              name="nickname"
              [(ngModel)]="nickname"
              placeholder="ericabreu"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
            />
          </div>
        </label>
        <button
          type="submit"
          class="btn btn-secundario"
          [attr.aria-busy]="buscando()"
          [disabled]="!nickname.trim()"
        >
          <app-icone nome="busca" [tamanho]="16" />
          Buscar
        </button>
      </form>

      @if (erro()) {
        <p class="faixa faixa-vermelha resultado">{{ erro() }}</p>
      }
      @if (jogador(); as encontrado) {
        <div class="resultado cartao-jogador">
          <span class="avatar avatar-lg verde">
            @if (imagem(encontrado); as src) {
              <img [src]="src" alt="" />
            } @else {
              {{ iniciais(encontrado.nome) }}
            }
          </span>
          <div>
            <strong>{{ encontrado.nome }}</strong>
            <span>&#64;{{ encontrado.nickname }}</span>
            @if (encontrado.cidade) {
              <span>{{ encontrado.cidade }}/{{ encontrado.estado }}</span>
            }
          </div>
        </div>
      }
      <ng-content />

      <div rodape>
        <button type="button" class="btn btn-secundario" (click)="aberto.set(false)">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primario"
          [disabled]="!jogador()"
          [attr.aria-busy]="ocupado()"
          (click)="escolher.emit(jogador()!)"
        >
          {{ acao() }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .busca {
      display: flex;
      align-items: flex-end;
      gap: 0.6rem;
    }
    .busca .campo {
      flex: 1;
    }
    .resultado {
      margin-top: 1rem;
    }
    .cartao-jogador {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.9rem;
      border-radius: var(--raio);
      border: 1px solid var(--verde-200);
      background: var(--verde-50);
    }
    .cartao-jogador strong,
    .cartao-jogador span {
      display: block;
    }
    .cartao-jogador strong {
      font-weight: 700;
    }
    .cartao-jogador span {
      font-size: 0.8125rem;
      color: var(--cor-texto-2);
    }
  `,
})
export class BuscarJogador {
  readonly aberto = model(false);
  readonly titulo = input('Encontrar jogador');
  readonly descricao = input<string>();
  readonly acao = input('Confirmar');
  // true enquanto o pai executa a ação
  readonly ocupado = input(false);
  readonly escolher = output<Jogador>();

  private readonly catalogo = inject(CatalogoService);
  protected nickname = '';
  protected readonly jogador = signal<Jogador | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly buscando = signal(false);
  protected readonly iniciais = iniciais;

  protected imagem(jogador: Jogador): string | undefined {
    return urlImagem(jogador.imagemPerfil);
  }

  protected buscar(): void {
    const nickname = this.nickname.trim().replace(/^@/, '');
    if (!nickname) return;
    this.buscando.set(true);
    this.erro.set(null);
    this.jogador.set(null);
    this.catalogo.buscarJogadorPorNickname(nickname).subscribe({
      next: (jogador) => {
        this.jogador.set(jogador);
        this.buscando.set(false);
      },
      error: (falha: unknown) => {
        this.erro.set(mensagemDeErro(falha, 'Nenhum jogador com esse nickname.'));
        this.buscando.set(false);
      },
    });
  }

  // O pai chama depois da ação, para a próxima busca começar limpa
  limpar(): void {
    this.nickname = '';
    this.jogador.set(null);
    this.erro.set(null);
  }
}
