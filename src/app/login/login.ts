import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { areaDaConta } from '../core/autenticado.guard';
import { configuracao } from '../core/configuracao';
import { mensagemDeErro } from '../core/erros';
import { AuthService } from '../core/services/auth.service';
import { SessaoService } from '../core/services/sessao.service';

// Contas do data.sql, para testar os dois painéis no modo demonstração
const CONTAS_DE_TESTE = [
  { rotulo: 'Loja', email: 'contato@cardhouse.com.br', senha: '123456' },
  { rotulo: 'Admin', email: 'admin@tcg.com', senha: 'admin123' },
];

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly sessao = inject(SessaoService);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly entrando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly mostrarSenha = signal(false);
  protected readonly modoMock = configuracao.usarMockApi;
  protected readonly contasDeTeste = CONTAS_DE_TESTE;

  // Já logado (só dá para saber no navegador): oferece voltar para o painel
  private readonly noNavegador = signal(false);
  protected readonly logado = computed(() => (this.noNavegador() ? this.sessao.conta() : null));
  protected readonly areaLogada = computed(() => {
    const conta = this.logado();
    return conta ? areaDaConta(conta.tipo) : null;
  });

  constructor() {
    afterNextRender(() => this.noNavegador.set(true));
  }

  protected preencher(conta: { email: string; senha: string }): void {
    this.form.setValue({ email: conta.email, senha: conta.senha });
    this.erro.set(null);
  }

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Informe o email e a senha.');
      return;
    }
    this.entrando.set(true);
    this.erro.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (conta) => {
        const voltar = this.rota.snapshot.queryParamMap.get('voltar');
        const area = areaDaConta(conta.tipo);
        this.router.navigateByUrl(voltar?.startsWith(area) ? voltar : area);
      },
      error: (falha: unknown) => {
        this.entrando.set(false);
        this.erro.set(mensagemDeErro(falha, 'Não foi possível entrar.'));
      },
    });
  }
}
