import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Loja } from '../../core/models/api';
import { LojaService } from '../../core/services/loja.service';
import { IdPlano, Plano, PLANOS } from '../../compartilhado/planos';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais, Tom } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';

type SituacaoAssinatura = 'ATIVA' | 'TESTE' | 'ATRASADA';

interface AssinaturaExemplo {
  loja: Loja;
  plano: Plano;
  situacao: SituacaoAssinatura;
  proximaCobranca: Date | null;
}

const SITUACAO: Record<SituacaoAssinatura, { rotulo: string; tom: Tom }> = {
  ATIVA: { rotulo: 'Em dia', tom: 'verde' },
  TESTE: { rotulo: 'Período de teste', tom: 'azul' },
  ATRASADA: { rotulo: 'Pagamento atrasado', tom: 'vermelho' },
};

// PRÉVIA: o backend ainda não tem planos nem assinaturas. As lojas são reais (GET /lojas);
// o plano e a situação de cada uma são de exemplo, sorteados pelo id da loja, só para desenhar a tela.
function assinaturaDeExemplo(loja: Loja, hoje: Date): AssinaturaExemplo {
  const plano: IdPlano = loja.contaId % 3 === 0 ? 'GRATUITO' : 'PRO';
  const situacao: SituacaoAssinatura =
    plano === 'GRATUITO'
      ? 'ATIVA'
      : (['ATIVA', 'ATIVA', 'TESTE', 'ATRASADA'] as const)[loja.contaId % 4];
  const proximaCobranca =
    plano === 'GRATUITO'
      ? null
      : new Date(hoje.getFullYear(), hoje.getMonth() + (situacao === 'ATRASADA' ? 0 : 1), 5);
  return { loja, plano: PLANOS.find((item) => item.id === plano)!, situacao, proximaCobranca };
}

@Component({
  selector: 'app-assinaturas',
  imports: [CurrencyPipe, DatePipe, Icone, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assinaturas.html',
  styleUrl: './assinaturas.css',
})
export class Assinaturas {
  private readonly servicoLojas = inject(LojaService);
  protected readonly lojas = recurso(() => this.servicoLojas.listar());
  protected readonly planos = PLANOS;
  protected readonly situacao = SITUACAO;
  protected readonly iniciais = iniciais;
  private readonly hoje = new Date();

  protected readonly assinaturas = computed(() =>
    (this.lojas.dados() ?? []).map((loja) => assinaturaDeExemplo(loja, this.hoje)),
  );

  protected readonly resumo = computed(() => {
    const lista = this.assinaturas();
    const pagantes = lista.filter(
      (item) => item.plano.precoMensal > 0 && item.situacao !== 'TESTE',
    );
    return {
      receitaMensal: pagantes.reduce((soma, item) => soma + item.plano.precoMensal, 0),
      pagantes: pagantes.length,
      emTeste: lista.filter((item) => item.situacao === 'TESTE').length,
      atrasadas: lista.filter((item) => item.situacao === 'ATRASADA').length,
      porPlano: Object.fromEntries(
        PLANOS.map((plano) => [
          plano.id,
          lista.filter((item) => item.plano.id === plano.id).length,
        ]),
      ),
    };
  });
}
