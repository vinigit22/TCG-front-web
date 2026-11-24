import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { areaDaConta } from '../core/autenticado.guard';
import { SessaoService } from '../core/services/sessao.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly sessao = inject(SessaoService);
  protected readonly menuAberto = signal(false);

  // A sessão só existe no navegador: até a página hidratar, o cabeçalho é igual ao gerado no build
  private readonly noNavegador = signal(false);
  protected readonly areaLogada = computed(() => {
    const conta = this.noNavegador() ? this.sessao.conta() : null;
    return conta ? areaDaConta(conta.tipo) : null;
  });

  constructor() {
    afterNextRender(() => this.noNavegador.set(true));
  }
}
