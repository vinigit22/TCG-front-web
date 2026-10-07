import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StatusTorneio, Torneio } from '../../core/models/api';
import { TorneioService } from '../../core/services/torneio.service';
import { EstadoVazio } from '../../ui/estado-vazio';
import { contem } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { Medidor } from '../../ui/medidor';
import { recurso } from '../../ui/recurso';
import { SeloTorneio } from '../../ui/selo-status';
import { idDaLojaLogada } from '../loja-atual';

interface Aba {
  id: string;
  rotulo: string;
  status: StatusTorneio[];
}

// Abas por fase do torneio (o filtro fica na URL: ?fase=...)
const ABAS: Aba[] = [
  { id: 'todos', rotulo: 'Todos', status: [] },
  { id: 'rascunhos', rotulo: 'Rascunhos', status: ['RASCUNHO'] },
  {
    id: 'inscricoes',
    rotulo: 'Inscrições',
    status: ['INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS'],
  },
  { id: 'andamento', rotulo: 'Em andamento', status: ['EM_ANDAMENTO'] },
  { id: 'finalizados', rotulo: 'Finalizados', status: ['FINALIZADO'] },
  { id: 'cancelados', rotulo: 'Cancelados', status: ['CANCELADO'] },
];

@Component({
  selector: 'app-lista-torneios',
  imports: [RouterLink, DatePipe, CurrencyPipe, Icone, Medidor, SeloTorneio, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lista-torneios.html',
  styleUrl: './lista-torneios.css',
})
export class ListaTorneios {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(TorneioService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly torneios = recurso(() => this.servico.listar({ lojaId: this.lojaId }));
  protected readonly abas = ABAS;
  protected readonly fase = toSignal(
    this.rota.queryParamMap.pipe(map((params) => params.get('fase') ?? 'todos')),
    { initialValue: 'todos' },
  );
  protected readonly busca = signal('');
  protected readonly jogoId = signal<number | null>(null);

  protected readonly contagem = computed(() => {
    const lista = this.torneios.dados() ?? [];
    return Object.fromEntries(
      ABAS.map((aba) => [
        aba.id,
        aba.status.length
          ? lista.filter((t) => aba.status.includes(t.status)).length
          : lista.length,
      ]),
    ) as Record<string, number>;
  });

  protected readonly jogos = computed(() => {
    const porId = new Map(
      (this.torneios.dados() ?? []).map((torneio) => [torneio.jogo.id, torneio.jogo]),
    );
    return [...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  });

  protected readonly filtrados = computed<Torneio[]>(() => {
    const aba = ABAS.find((item) => item.id === this.fase()) ?? ABAS[0];
    const termo = this.busca();
    const jogoId = this.jogoId();
    return (this.torneios.dados() ?? [])
      .filter((torneio) => aba.status.length === 0 || aba.status.includes(torneio.status))
      .filter((torneio) => jogoId === null || torneio.jogo.id === jogoId)
      .filter((torneio) => contem(torneio.titulo, termo))
      .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
  });

  protected abrir(torneio: Torneio): void {
    this.router.navigate(['/painel/torneios', torneio.id]);
  }

  protected escolherJogo(valor: string): void {
    this.jogoId.set(valor ? Number(valor) : null);
  }

  protected limparFiltros(): void {
    this.busca.set('');
    this.jogoId.set(null);
  }
}
