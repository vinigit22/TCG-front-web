import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { configuracao } from '../core/configuracao';
import { mensagemDeErro } from '../core/erros';
import { AuthService } from '../core/services/auth.service';
import { aplicarErrosDoServidor, erroDoCampo } from '../ui/erros-form';

// Cadastro de loja (POST /auth/registro/loja: AuthService.cadastrarLoja). Já entra no painel em seguida.
@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Mesmas regras do RegistroLojaRequest do backend
  protected readonly form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)],
    }),
    senha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
    }),
    telefone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    descricao: new FormControl('', { nonNullable: true }),
  });
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly modoMock = configuracao.usarMockApi;

  protected erroCampo(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected cadastrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);
    this.auth
      .cadastrarLoja({
        nome: valor.nome.trim(),
        email: valor.email.trim(),
        senha: valor.senha,
        telefone: valor.telefone.trim() || null,
        descricao: valor.descricao.trim() || null,
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/painel'),
        error: (falha: unknown) => {
          this.enviando.set(false);
          aplicarErrosDoServidor(this.form, falha);
          this.erro.set(mensagemDeErro(falha, 'Não foi possível cadastrar a loja.'));
        },
      });
  }
}
