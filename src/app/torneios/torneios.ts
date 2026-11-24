import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StatusTorneio, Torneio } from '../core/models/api';
import { CatalogoService } from '../core/services/catalogo.service';
import { TorneioService } from '../core/services/torneio.service';
import { Icone } from '../ui/icone';
import { Medidor } from '../ui/medidor';
import { recurso } from '../ui/recurso';
import { SeloTorneio } from '../ui/selo-status';

// O que interessa a quem procura torneio: inscrições abertas, encerradas (check-in no dia) e em andamento
const STATUS_PUBLICOS: StatusTorneio[] = [
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'EM_ANDAMENTO',
];

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Torneios públicos (GET /torneios). Com usarMockApi = true vêm do mock; com false, do TCGBackend.
// Filtro opcional por jogo na URL: /torneios?jogo=magic (os cartões da página Jogos levam até aqui).
@Component({
  selector: 'app-torneios',
  imports: [RouterLink, Icone, Medidor, SeloTorneio],
  templateUrl: './torneios.html',
  styleUrl: './torneios.css',
})
export class Torneios {
  private readonly servico = inject(TorneioService);
  private readonly catalogo = inject(CatalogoService);

  protected readonly torneios = recurso(() => this.servico.listar({ status: STATUS_PUBLICOS }));
  private readonly jogos = recurso(() => this.catalogo.listarJogos());
  protected readonly jogo = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('jogo'))),
    { initialValue: null },
  );

  protected readonly nomeDoJogo = computed(
    () => this.jogos.dados()?.find((jogo) => jogo.slug === this.jogo())?.nome ?? this.jogo(),
  );

  // Do mais próximo para o mais distante
  protected readonly visiveis = computed(() =>
    (this.torneios.dados() ?? [])
      .filter((torneio) => !this.jogo() || torneio.jogo.slug === this.jogo())
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
  );

  // vagasOcupadas vem do backend; sem ele, calcula pelas vagas disponíveis
  protected ocupadas(torneio: Torneio): number {
    return torneio.vagasOcupadas ?? Math.max(0, torneio.vagasMax - torneio.vagasDisponiveis);
  }

  // "2026-09-05T19:00:00" -> "05 Set 2026 · 19h" (19h30 quando tem minutos)
  protected dataCurta(valor: string): string {
    const data = new Date(valor);
    const dia = String(data.getDate()).padStart(2, '0');
    const minutos = data.getMinutes() ? String(data.getMinutes()).padStart(2, '0') : '';
    return `${dia} ${MESES[data.getMonth()]} ${data.getFullYear()} · ${data.getHours()}h${minutos}`;
  }

  // 25 -> "R$ 25"; 12.5 -> "R$ 12,50"; 0 -> "Grátis"
  protected taxa(valor: number): string {
    if (!valor) return 'Grátis';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    });
  }

  // O torneio pode ser em outro endereço; sem endereço próprio, é na loja
  protected cidade(torneio: Torneio): string | null {
    const endereco = torneio.endereco ?? torneio.loja.endereco;
    return endereco ? `${endereco.cidade}/${endereco.estado}` : null;
  }
}
