import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { StatusTorneio, Torneio } from '../../core/models/api';
import { TRANSICOES_STATUS_TORNEIO } from '../../core/regras';
import { ROTULOS_STATUS_TORNEIO } from '../../core/rotulos';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import { ChaveVisual } from '../../ui/chave-visual';
import { Confirmacao } from '../../ui/confirmacao';
import { EstadoVazio } from '../../ui/estado-vazio';
import { contem } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { Medidor } from '../../ui/medidor';
import { MenuAcoes } from '../../ui/menu-acoes';
import { Modal } from '../../ui/modal';
import { recurso } from '../../ui/recurso';
import { SeloTorneio } from '../../ui/selo-status';

@Component({
  selector: 'app-torneios-admin',
  imports: [DatePipe, Icone, EstadoVazio, SeloTorneio, Medidor, MenuAcoes, Modal, ChaveVisual],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './torneios-admin.html',
  styleUrl: './torneios-admin.css',
})
export class TorneiosAdmin {
  private readonly servico = inject(TorneioService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);

  protected readonly torneios = recurso(() => this.servico.listar());
  protected readonly status = signal<StatusTorneio | 'todos'>('todos');
  protected readonly busca = signal('');
  protected readonly lojaId = signal<number | null>(
    numeroOuNulo(inject(ActivatedRoute).snapshot.queryParamMap.get('loja')),
  );
  protected readonly jogoId = signal<number | null>(null);
  protected readonly rotuloStatus = ROTULOS_STATUS_TORNEIO;
  protected readonly opcoesStatus = Object.keys(ROTULOS_STATUS_TORNEIO) as StatusTorneio[];

  // Chave aberta na janela
  protected readonly torneioChave = signal<Torneio | null>(null);
  protected readonly chave = recurso(() => {
    const torneio = this.torneioChave();
    return torneio ? this.servico.listarChaveamento(torneio.id) : of([]);
  });

  protected readonly lojas = computed(() => {
    const mapa = new Map(
      (this.torneios.dados() ?? []).map((torneio) => [torneio.loja.contaId, torneio.loja.nome]),
    );
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  });

  protected readonly jogos = computed(() => {
    const mapa = new Map(
      (this.torneios.dados() ?? []).map((torneio) => [torneio.jogo.id, torneio.jogo.nome]),
    );
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  });

  protected readonly visiveis = computed(() => {
    const status = this.status();
    const termo = this.busca();
    const lojaId = this.lojaId();
    const jogoId = this.jogoId();
    return (this.torneios.dados() ?? [])
      .filter((torneio) => status === 'todos' || torneio.status === status)
      .filter((torneio) => lojaId === null || torneio.loja.contaId === lojaId)
      .filter((torneio) => jogoId === null || torneio.jogo.id === jogoId)
      .filter((torneio) => contem(torneio.titulo, termo) || contem(torneio.loja.nome, termo))
      .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
  });

  protected podeCancelar(torneio: Torneio): boolean {
    return TRANSICOES_STATUS_TORNEIO[torneio.status].includes('CANCELADO');
  }

  protected numero(valor: string): number | null {
    return valor ? Number(valor) : null;
  }

  protected abrirChave(torneio: Torneio): void {
    this.torneioChave.set(torneio);
  }

  protected async cancelar(torneio: Torneio): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Cancelar este torneio?',
      mensagem: `"${torneio.titulo}" (${torneio.loja.nome}) é cancelado e os inscritos recebem o aviso no app. Use só em caso de problema (denúncia, erro da loja).`,
      confirmar: 'Cancelar torneio',
      perigo: true,
    });
    if (!sim) return;
    this.servico.alterarStatus(torneio.id, 'CANCELADO').subscribe({
      next: () => {
        this.avisos.sucesso('Torneio cancelado', torneio.titulo);
        this.torneios.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível cancelar'),
    });
  }

  protected async excluir(torneio: Torneio): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir torneio?',
      mensagem: `"${torneio.titulo}" some do painel da loja e do app, junto com chave e resultados.`,
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(torneio.id).subscribe({
      next: () => {
        this.avisos.sucesso('Torneio excluído', torneio.titulo);
        this.torneios.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha, 'Não foi possível excluir'),
    });
  }
}

function numeroOuNulo(valor: string | null): number | null {
  return valor ? Number(valor) : null;
}
