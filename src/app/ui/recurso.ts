import { DestroyRef, effect, inject, Signal, signal, untracked } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { mensagemDeErro } from '../core/erros';

// Estado de uma consulta à API para usar nos templates
export interface Recurso<T> {
  readonly dados: Signal<T | undefined>;
  // true também ao recarregar: os dados anteriores continuam na tela (sem piscar)
  readonly carregando: Signal<boolean>;
  readonly erro: Signal<string | null>;
  recarregar(): void;
  // Atualiza os dados na tela depois de uma ação, sem consultar a API de novo
  definir(valor: T): void;
}

// Executa a consulta e repete sozinha quando algum signal lido dentro de `consulta` muda
// (filtros, id da rota...). Chame num inicializador de campo ou no construtor do componente.
export function recurso<T>(
  consulta: () => Observable<T>,
  mensagemPadrao = 'Não foi possível carregar os dados.',
): Recurso<T> {
  const dados = signal<T | undefined>(undefined);
  const carregando = signal(true);
  const erro = signal<string | null>(null);
  let inscricao: Subscription | undefined;

  const executar = (observavel: Observable<T>) => {
    inscricao?.unsubscribe();
    carregando.set(true);
    erro.set(null);
    inscricao = observavel.subscribe({
      next: (valor) => {
        dados.set(valor);
        carregando.set(false);
      },
      error: (falha: unknown) => {
        erro.set(mensagemDeErro(falha, mensagemPadrao));
        carregando.set(false);
      },
    });
  };

  effect(() => {
    const observavel = consulta();
    untracked(() => executar(observavel));
  });
  inject(DestroyRef).onDestroy(() => inscricao?.unsubscribe());

  return {
    dados: dados.asReadonly(),
    carregando: carregando.asReadonly(),
    erro: erro.asReadonly(),
    recarregar: () => executar(untracked(consulta)),
    definir: (valor) => dados.set(valor),
  };
}
