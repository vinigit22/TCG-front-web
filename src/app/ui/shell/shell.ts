import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { configuracao } from '../../core/configuracao';
import { AuthService } from '../../core/services/auth.service';
import { SessaoService } from '../../core/services/sessao.service';
import { AvisosHost } from '../avisos';
import { ConfirmacaoHost } from '../confirmacao';
import { iniciais } from '../formatar';
import { Icone, NomeIcone } from '../icone';
import { Marca } from '../marca';

export interface ItemMenu {
  rotulo: string;
  rota: string;
  icone: NomeIcone;
  // true: só fica ativo na rota exata (a página inicial da área)
  exato?: boolean;
  contador?: number;
}

export interface GrupoMenu {
  titulo?: string;
  itens: ItemMenu[];
}

// Layout dos painéis (loja e admin): menu lateral, barra do topo e área de conteúdo
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, Icone, Marca, AvisosHost, ConfirmacaoHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly area = input.required<string>();
  readonly tom = input<'loja' | 'admin'>('loja');
  readonly menu = input.required<GrupoMenu[]>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly conta = inject(SessaoService).conta;
  protected readonly menuAberto = signal(false);
  protected readonly modoMock = configuracao.usarMockApi;
  protected readonly iniciais = iniciais;

  protected sair(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
