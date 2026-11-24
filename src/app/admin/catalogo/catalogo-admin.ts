import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { logoDoJogo } from '../../core/jogos';
import { Formato, Jogo } from '../../core/models/api';
import { CatalogoService } from '../../core/services/catalogo.service';
import { Avisos } from '../../ui/avisos';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { gerarSlug, iniciais } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { Modal } from '../../ui/modal';
import { recurso } from '../../ui/recurso';

interface RascunhoJogo {
  id?: number;
  nome: string;
  slug: string;
  icone: string;
  ativo: boolean;
}

@Component({
  selector: 'app-catalogo-admin',
  imports: [FormsModule, Icone, EstadoVazio, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo-admin.html',
  styleUrl: './catalogo-admin.css',
})
export class CatalogoAdmin {
  private readonly servico = inject(CatalogoService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);

  protected readonly jogos = recurso(() => this.servico.listarJogos());
  protected readonly formatos = recurso(() => this.servico.listarFormatos());
  protected readonly selecionadoId = signal<number | null>(null);
  protected readonly logoDoJogo = logoDoJogo;
  protected readonly iniciais = iniciais;
  protected readonly gerarSlug = gerarSlug;

  protected readonly salvando = signal(false);
  protected readonly jogoEmEdicao = signal<RascunhoJogo | null>(null);
  protected readonly formatoEmEdicao = signal<Formato | null>(null);
  protected nomeFormatoEditado = '';
  protected novoFormato = '';

  protected readonly selecionado = computed<Jogo | undefined>(() => {
    const jogos = this.jogos.dados() ?? [];
    return jogos.find((jogo) => jogo.id === this.selecionadoId()) ?? jogos[0];
  });

  protected readonly formatosPorJogo = computed(() => {
    const mapa = new Map<number, Formato[]>();
    for (const formato of this.formatos.dados() ?? []) {
      mapa.set(formato.jogo.id, [...(mapa.get(formato.jogo.id) ?? []), formato]);
    }
    return mapa;
  });

  protected readonly formatosDoSelecionado = computed(() => {
    const jogo = this.selecionado();
    return jogo ? (this.formatosPorJogo().get(jogo.id) ?? []) : [];
  });

  // ------------------------------------------------------------------ Jogos

  protected novoJogo(): void {
    this.jogoEmEdicao.set({ nome: '', slug: '', icone: '', ativo: true });
  }

  protected editarJogo(jogo: Jogo): void {
    this.jogoEmEdicao.set({
      id: jogo.id,
      nome: jogo.nome,
      slug: jogo.slug,
      icone: jogo.icone ?? '',
      ativo: jogo.ativo,
    });
  }

  protected salvarJogo(rascunho: RascunhoJogo): void {
    if (!rascunho.nome.trim()) return;
    const dados = {
      nome: rascunho.nome.trim(),
      slug: rascunho.slug.trim() || null,
      icone: rascunho.icone.trim() || null,
      ativo: rascunho.ativo,
    };
    this.executar(
      rascunho.id ? this.servico.atualizarJogo(rascunho.id, dados) : this.servico.criarJogo(dados),
      rascunho.id ? 'Jogo atualizado' : 'Jogo adicionado ao catálogo',
      (jogo) => {
        this.jogoEmEdicao.set(null);
        this.selecionadoId.set((jogo as Jogo).id);
        this.jogos.recarregar();
      },
    );
  }

  protected alternarJogo(jogo: Jogo): void {
    this.executar(
      this.servico.atualizarJogo(jogo.id, {
        nome: jogo.nome,
        slug: jogo.slug,
        icone: jogo.icone,
        ativo: !jogo.ativo,
      }),
      jogo.ativo ? 'Jogo desativado: não aceita torneios novos' : 'Jogo reativado',
      () => this.jogos.recarregar(),
    );
  }

  protected async excluirJogo(jogo: Jogo): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: `Excluir ${jogo.nome}?`,
      mensagem:
        'Se já existem torneios desse jogo, prefira desativar: ele some da criação de torneios mas o histórico fica.',
      confirmar: 'Excluir jogo',
      perigo: true,
    });
    if (!sim) return;
    this.executar(this.servico.excluirJogo(jogo.id), 'Jogo excluído', () => {
      this.selecionadoId.set(null);
      this.jogos.recarregar();
      this.formatos.recarregar();
    });
  }

  // ------------------------------------------------------------------ Formatos

  protected adicionarFormato(): void {
    const jogo = this.selecionado();
    const nome = this.novoFormato.trim();
    if (!jogo || !nome) return;
    this.executar(
      this.servico.criarFormato({ jogoId: jogo.id, nome, ativo: true }),
      `Formato ${nome} adicionado`,
      () => {
        this.novoFormato = '';
        this.formatos.recarregar();
      },
    );
  }

  protected editarFormato(formato: Formato): void {
    this.nomeFormatoEditado = formato.nome;
    this.formatoEmEdicao.set(formato);
  }

  protected salvarFormato(): void {
    const formato = this.formatoEmEdicao();
    const nome = this.nomeFormatoEditado.trim();
    if (!formato || !nome) return;
    this.executar(
      this.servico.atualizarFormato(formato.id, {
        jogoId: formato.jogo.id,
        nome,
        ativo: formato.ativo,
      }),
      'Formato atualizado',
      () => {
        this.formatoEmEdicao.set(null);
        this.formatos.recarregar();
      },
    );
  }

  protected alternarFormato(formato: Formato): void {
    this.executar(
      this.servico.atualizarFormato(formato.id, {
        jogoId: formato.jogo.id,
        nome: formato.nome,
        ativo: !formato.ativo,
      }),
      formato.ativo ? 'Formato desativado' : 'Formato reativado',
      () => this.formatos.recarregar(),
    );
  }

  protected async excluirFormato(formato: Formato): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: `Excluir o formato ${formato.nome}?`,
      mensagem:
        'Torneios que usam este formato podem impedir a exclusão. Nesse caso, desative o formato.',
      confirmar: 'Excluir',
      perigo: true,
    });
    if (sim)
      this.executar(this.servico.excluirFormato(formato.id), 'Formato excluído', () =>
        this.formatos.recarregar(),
      );
  }

  private executar(
    acao: Observable<unknown>,
    mensagem: string,
    depois: (resultado: unknown) => void,
  ): void {
    this.salvando.set(true);
    acao.subscribe({
      next: (resultado) => {
        this.salvando.set(false);
        this.avisos.sucesso(mensagem);
        depois(resultado);
      },
      error: (falha: unknown) => {
        this.salvando.set(false);
        this.avisos.erro(falha);
      },
    });
  }
}
