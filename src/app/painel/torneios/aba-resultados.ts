import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Torneio, TorneioResultado } from '../../core/models/api';
import { ResultadoService } from '../../core/services/resultado.service';
import { Avisos } from '../../ui/avisos';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais } from '../../ui/formatar';
import { Icone } from '../../ui/icone';

@Component({
  selector: 'app-aba-resultados',
  imports: [EstadoVazio, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aba-resultados.html',
  styleUrl: './aba-resultados.css',
})
export class AbaResultados {
  readonly torneio = input.required<Torneio>();
  readonly resultados = input.required<TorneioResultado[]>();
  readonly carregando = input(false);
  readonly alterou = output<void>();

  private readonly servico = inject(ResultadoService);
  private readonly avisos = inject(Avisos);
  protected readonly salvando = signal<number | null>(null);
  protected readonly iniciais = iniciais;

  protected readonly ordenados = computed(() =>
    [...this.resultados()].sort((a, b) => a.colocacao - b.colocacao || b.vitorias - a.vitorias),
  );

  // Pódio: 2º, 1º, 3º (os dois 3º lugares da semifinal ficam juntos)
  protected readonly podio = computed(() => {
    const lista = this.ordenados();
    return {
      ouro: lista.filter((item) => item.colocacao === 1),
      prata: lista.filter((item) => item.colocacao === 2),
      bronze: lista.filter((item) => item.colocacao === 3),
    };
  });

  protected medalha(colocacao: number): string {
    return colocacao === 1 ? 'ouro' : colocacao === 2 ? 'prata' : colocacao === 3 ? 'bronze' : '';
  }

  protected salvarPremio(resultado: TorneioResultado, valor: string): void {
    const premioRecebido = valor.trim() || null;
    if (premioRecebido === resultado.premioRecebido) return;
    this.salvando.set(resultado.id);
    this.servico
      .atualizar(resultado.id, {
        colocacao: resultado.colocacao,
        vitorias: resultado.vitorias,
        derrotas: resultado.derrotas,
        empates: resultado.empates,
        premioRecebido,
      })
      .subscribe({
        next: () => {
          this.salvando.set(null);
          this.avisos.sucesso(
            'Prêmio salvo',
            `${resultado.jogador.nome}: ${premioRecebido ?? 'sem prêmio'}`,
          );
          this.alterou.emit();
        },
        error: (falha: unknown) => {
          this.salvando.set(null);
          this.avisos.erro(falha, 'Não foi possível salvar o prêmio');
        },
      });
  }
}
