import { ChangeDetectionStrategy, Component, inject, Injectable, signal } from '@angular/core';
import { mensagemDeErro } from '../core/erros';
import { Icone, NomeIcone } from './icone';

export type TomAviso = 'sucesso' | 'erro' | 'info';

interface Aviso {
  id: number;
  tom: TomAviso;
  titulo: string;
  texto?: string;
}

const DURACAO_MS = 5000;
const ICONE_DO_TOM: Record<TomAviso, NomeIcone> = {
  sucesso: 'verificado',
  erro: 'alerta',
  info: 'info',
};

// Mensagens rápidas no canto da tela (salvou, deu erro...). O <app-avisos> fica no layout dos painéis.
@Injectable({ providedIn: 'root' })
export class Avisos {
  private proximoId = 1;
  readonly lista = signal<Aviso[]>([]);

  sucesso(titulo: string, texto?: string): void {
    this.mostrar('sucesso', titulo, texto);
  }

  info(titulo: string, texto?: string): void {
    this.mostrar('info', titulo, texto);
  }

  // Aceita o erro da API direto: o texto vem do campo "detail" do backend
  erro(falha: unknown, titulo = 'Não deu certo'): void {
    this.mostrar('erro', titulo, mensagemDeErro(falha, 'Tente de novo em instantes.'));
  }

  remover(id: number): void {
    this.lista.update((avisos) => avisos.filter((aviso) => aviso.id !== id));
  }

  private mostrar(tom: TomAviso, titulo: string, texto?: string): void {
    const id = this.proximoId++;
    this.lista.update((avisos) => [...avisos.slice(-3), { id, tom, titulo, texto }]);
    setTimeout(() => this.remover(id), tom === 'erro' ? DURACAO_MS * 2 : DURACAO_MS);
  }
}

@Component({
  selector: 'app-avisos',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avisos" aria-live="polite" aria-relevant="additions">
      @for (aviso of avisos.lista(); track aviso.id) {
        <div class="aviso" [class]="'aviso aviso-' + aviso.tom" role="status">
          <app-icone [nome]="icone[aviso.tom]" [tamanho]="20" />
          <div class="aviso-texto">
            <strong>{{ aviso.titulo }}</strong>
            @if (aviso.texto) {
              <p>{{ aviso.texto }}</p>
            }
          </div>
          <button type="button" class="aviso-fechar" (click)="avisos.remover(aviso.id)">
            <app-icone nome="x" [tamanho]="16" />
            <span class="sr-only">Fechar</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .avisos {
      position: fixed;
      right: 1.25rem;
      bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: min(380px, calc(100vw - 2.5rem));
      pointer-events: none;
    }
    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.9rem 0.9rem 0.9rem 1rem;
      border-radius: 14px;
      background: var(--tinta-900);
      color: #fff;
      box-shadow: var(--sombra-lg);
      pointer-events: auto;
      animation: entrar 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .aviso-sucesso app-icone {
      color: var(--verde-300);
    }
    .aviso-erro app-icone {
      color: #ff9aa0;
    }
    .aviso-info app-icone {
      color: var(--roxo-300);
    }
    .aviso-texto {
      flex: 1;
      min-width: 0;
      font-size: 0.875rem;
    }
    .aviso-texto strong {
      display: block;
      font-weight: 700;
    }
    .aviso-texto p {
      margin-top: 0.2rem;
      color: var(--tinta-300);
      line-height: 1.45;
    }
    .aviso-fechar {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--tinta-400);
    }
    .aviso-fechar:hover {
      background: rgb(255 255 255 / 0.1);
      color: #fff;
    }
    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
    }
  `,
})
export class AvisosHost {
  protected readonly avisos = inject(Avisos);
  protected readonly icone = ICONE_DO_TOM;
}
