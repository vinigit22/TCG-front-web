import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { LoginResponse } from '../models/api';
import { ContaSessao, contaDaResposta } from '../models/sessao';

const CHAVE_TOKEN = '@TCGTorneios:painel:token';
const CHAVE_CONTA = '@TCGTorneios:painel:conta';

// Token e conta logada, guardados no localStorage do navegador.
// No servidor (SSR/prerender) não há localStorage: a sessão começa vazia e é lida no navegador.
@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly noNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly contaAtual = signal<ContaSessao | null>(this.lerConta());

  readonly conta = this.contaAtual.asReadonly();
  readonly autenticado = computed(() => this.contaAtual() !== null);

  get token(): string | null {
    return this.ler(CHAVE_TOKEN);
  }

  iniciar(resposta: LoginResponse): ContaSessao {
    const conta = contaDaResposta(resposta);
    this.gravar(CHAVE_TOKEN, resposta.token);
    this.gravar(CHAVE_CONTA, JSON.stringify(conta));
    this.contaAtual.set(conta);
    return conta;
  }

  atualizarConta(dados: Partial<Omit<ContaSessao, 'id' | 'tipo'>>): void {
    const atual = this.contaAtual();
    if (!atual) return;
    const conta = { ...atual, ...dados };
    this.gravar(CHAVE_CONTA, JSON.stringify(conta));
    this.contaAtual.set(conta);
  }

  encerrar(): void {
    this.remover(CHAVE_TOKEN);
    this.remover(CHAVE_CONTA);
    this.contaAtual.set(null);
  }

  private lerConta(): ContaSessao | null {
    const salva = this.ler(CHAVE_CONTA);
    if (!salva || !this.ler(CHAVE_TOKEN)) return null;
    try {
      return JSON.parse(salva) as ContaSessao;
    } catch {
      return null;
    }
  }

  private ler(chave: string): string | null {
    if (!this.noNavegador) return null;
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }

  private gravar(chave: string, valor: string): void {
    if (!this.noNavegador) return;
    try {
      localStorage.setItem(chave, valor);
    } catch {
      // Navegação privada ou armazenamento bloqueado: a sessão vale só até recarregar a página
    }
  }

  private remover(chave: string): void {
    if (!this.noNavegador) return;
    try {
      localStorage.removeItem(chave);
    } catch {
      // idem
    }
  }
}
