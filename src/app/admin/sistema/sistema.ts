import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { configuracao, urlApi } from '../../core/configuracao';
import { mensagemDeErro } from '../../core/erros';
import { SessaoService } from '../../core/services/sessao.service';
import { Icone, NomeIcone } from '../../ui/icone';

interface Servico {
  nome: string;
  descricao: string;
  rota: string;
  icone: NomeIcone;
}

interface Checagem {
  estado: 'verificando' | 'ok' | 'lento' | 'erro';
  ms: number | null;
  detalhe: string;
  em: Date;
}

// Uma consulta leve de cada área da API
const SERVICOS: Servico[] = [
  { nome: 'Autenticação', descricao: 'Token e conta logada', rota: '/auth/me', icone: 'cadeado' },
  { nome: 'Contas', descricao: 'Cadastro de contas (admin)', rota: '/contas', icone: 'usuario' },
  { nome: 'Lojas', descricao: 'Perfis das lojas', rota: '/lojas', icone: 'loja' },
  { nome: 'Torneios', descricao: 'Torneios, vagas e chaves', rota: '/torneios', icone: 'trofeu' },
  { nome: 'Catálogo', descricao: 'Jogos e formatos', rota: '/jogos', icone: 'grade' },
  {
    nome: 'Notificações',
    descricao: 'Avisos das contas',
    rota: '/notificacoes/nao-lidas/total',
    icone: 'sino',
  },
];

const LIMITE_LENTO_MS = 800;

@Component({
  selector: 'app-sistema',
  imports: [Icone, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sistema.html',
  styleUrl: './sistema.css',
})
export class Sistema {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoService);

  protected readonly servicos = SERVICOS;
  protected readonly modoMock = configuracao.usarMockApi;
  protected readonly apiUrl = configuracao.apiUrl;
  protected readonly checagens = signal<Record<string, Checagem>>({});

  protected readonly resumo = computed(() => {
    const lista = Object.values(this.checagens());
    return {
      ok: lista.filter((item) => item.estado === 'ok').length,
      lentos: lista.filter((item) => item.estado === 'lento').length,
      erros: lista.filter((item) => item.estado === 'erro').length,
      verificando: lista.some((item) => item.estado === 'verificando'),
    };
  });

  // Token JWT: o "exp" do payload diz quando a sessão expira (no modo mock o token é "mock.<id>")
  protected readonly token = computed(() => {
    const token = this.sessao.token;
    const conta = this.sessao.conta();
    if (!token) return null;
    if (token.startsWith('mock.')) return { tipo: 'Token de demonstração', expira: null, conta };
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      return { tipo: 'JWT', expira: payload.exp ? new Date(payload.exp * 1000) : null, conta };
    } catch {
      return { tipo: 'JWT', expira: null, conta };
    }
  });

  constructor() {
    this.verificarTudo();
  }

  protected verificarTudo(): void {
    for (const servico of SERVICOS) this.verificar(servico);
  }

  private verificar(servico: Servico): void {
    const inicio = performance.now();
    this.definir(servico.rota, {
      estado: 'verificando',
      ms: null,
      detalhe: 'Consultando…',
      em: new Date(),
    });
    this.http
      .get(urlApi(servico.rota))
      .pipe(
        map(() => null),
        catchError((falha: unknown) => of(falha)),
      )
      .subscribe((falha) => {
        const ms = Math.round(performance.now() - inicio);
        if (falha) {
          this.definir(servico.rota, {
            estado: 'erro',
            ms,
            detalhe: mensagemDeErro(falha, 'Sem resposta'),
            em: new Date(),
          });
        } else {
          this.definir(servico.rota, {
            estado: ms > LIMITE_LENTO_MS ? 'lento' : 'ok',
            ms,
            detalhe: ms > LIMITE_LENTO_MS ? 'Respondeu, mas devagar' : 'Respondendo',
            em: new Date(),
          });
        }
      });
  }

  private definir(rota: string, checagem: Checagem): void {
    this.checagens.update((atual) => ({ ...atual, [rota]: checagem }));
  }
}
