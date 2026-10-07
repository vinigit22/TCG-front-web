import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Jogador, LojaMembro, PapelMembro } from '../../core/models/api';
import { ROTULOS_PAPEL_MEMBRO } from '../../core/rotulos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { LojaService } from '../../core/services/loja.service';
import { Avisos } from '../../ui/avisos';
import { BuscarJogador } from '../../ui/buscar-jogador';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais } from '../../ui/formatar';
import { Icone, NomeIcone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';
import { idDaLojaLogada } from '../loja-atual';

// O que cada papel pode fazer (as mesmas regras do PermissaoService do backend)
const PAPEIS: { papel: PapelMembro; icone: NomeIcone; texto: string }[] = [
  {
    papel: 'PROPRIETARIO',
    icone: 'escudo-check',
    texto: 'Tudo, inclusive editar o perfil da loja e montar a equipe.',
  },
  {
    papel: 'ORGANIZADOR',
    icone: 'calendario',
    texto: 'Cria e conduz torneios e eventos: inscrições, check-in, chave e resultados.',
  },
  {
    papel: 'JUIZ',
    icone: 'bandeira',
    texto: 'Mesmo acesso do organizador aos torneios, para lançar resultados nas mesas.',
  },
];

@Component({
  selector: 'app-equipe',
  imports: [DatePipe, FormsModule, Icone, EstadoVazio, BuscarJogador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipe.html',
  styleUrl: './equipe.css',
})
export class Equipe {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(LojaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly busca = viewChild(BuscarJogador);

  protected readonly membros = recurso(() => this.servico.listarMembros(this.lojaId));
  // Os membros vêm com a conta (email); o nome e o nickname vêm do perfil de jogador
  private readonly jogadores = recurso(() => this.catalogo.listarJogadores());

  protected readonly papeis = PAPEIS;
  protected readonly rotuloPapel = ROTULOS_PAPEL_MEMBRO;
  protected readonly opcoesPapel = Object.keys(ROTULOS_PAPEL_MEMBRO) as PapelMembro[];
  protected readonly iniciais = iniciais;
  protected readonly buscaAberta = signal(false);
  protected readonly adicionando = signal(false);
  protected readonly ocupado = signal<number | null>(null);
  protected papelNovo: PapelMembro = 'ORGANIZADOR';

  private readonly perfis = computed(
    () => new Map((this.jogadores.dados() ?? []).map((jogador) => [jogador.contaId, jogador])),
  );

  protected readonly linhas = computed(() =>
    (this.membros.dados() ?? []).map((membro) => {
      const perfil = this.perfis().get(membro.conta.id);
      const ehALoja = membro.conta.id === this.lojaId;
      return {
        membro,
        nome: ehALoja ? membro.loja.nome : (perfil?.nome ?? membro.conta.email),
        detalhe: ehALoja
          ? 'Conta da loja'
          : perfil
            ? `@${perfil.nickname} · ${membro.conta.email}`
            : membro.conta.email,
        ehALoja,
      };
    }),
  );

  protected adicionar(jogador: Jogador): void {
    this.adicionando.set(true);
    this.servico
      .adicionarMembro({
        lojaId: this.lojaId,
        contaId: jogador.contaId,
        papel: this.papelNovo,
        ativo: true,
      })
      .subscribe({
        next: () => {
          this.adicionando.set(false);
          this.buscaAberta.set(false);
          this.busca()?.limpar();
          this.avisos.sucesso(
            'Membro adicionado',
            `${jogador.nome} agora é ${ROTULOS_PAPEL_MEMBRO[this.papelNovo].toLowerCase()}.`,
          );
          this.membros.recarregar();
        },
        error: (falha: unknown) => {
          this.adicionando.set(false);
          this.avisos.erro(falha, 'Não foi possível adicionar');
        },
      });
  }

  protected atualizar(
    membro: LojaMembro,
    mudancas: { papel?: PapelMembro; ativo?: boolean },
  ): void {
    this.ocupado.set(membro.id);
    this.servico
      .atualizarMembro(membro.id, {
        papel: mudancas.papel ?? membro.papel,
        ativo: mudancas.ativo ?? membro.ativo,
      })
      .subscribe({
        next: () => {
          this.ocupado.set(null);
          this.avisos.sucesso('Equipe atualizada');
          this.membros.recarregar();
        },
        error: (falha: unknown) => {
          this.ocupado.set(null);
          this.avisos.erro(falha);
          this.membros.recarregar();
        },
      });
  }

  protected async remover(linha: { membro: LojaMembro; nome: string }): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Remover da equipe?',
      mensagem: `${linha.nome} perde o acesso aos torneios e eventos da loja.`,
      confirmar: 'Remover',
      perigo: true,
    });
    if (!sim) return;
    this.servico.removerMembro(linha.membro.id).subscribe({
      next: () => {
        this.avisos.sucesso('Removido da equipe');
        this.membros.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }
}
