import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../core/erros';
import { AuthService } from '../core/services/auth.service';

type Etapa = 'email' | 'codigo' | 'pronto';

// Duas etapas na mesma página:
//  1) a loja informa o email e a API envia o código (POST /auth/esqueci-senha)
//  2) ela cola o código do email e escolhe a nova senha (POST /auth/redefinir-senha)
@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.html',
  // Mesmo visual da tela de login
  styleUrl: '../login/login.css',
})
export class EsqueciSenha {
  private readonly auth = inject(AuthService);

  protected readonly etapa = signal<Etapa>('email');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly mostrarSenha = signal(false);

  protected readonly formEmail = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly formRedefinir = new FormGroup({
    codigo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    novaSenha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirmacao: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected enviarEmail(): void {
    if (this.formEmail.invalid) {
      this.formEmail.markAllAsTouched();
      this.erro.set('Informe um email válido.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.auth.esqueciSenha(this.formEmail.controls.email.value.trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.etapa.set('codigo');
      },
      error: (falha: unknown) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(falha, 'Não foi possível enviar o código. Tente novamente.'));
      },
    });
  }

  protected redefinir(): void {
    const { codigo, novaSenha, confirmacao } = this.formRedefinir.getRawValue();

    if (!codigo.trim()) {
      this.erro.set('Cole o código que chegou no seu email.');
      return;
    }
    if (novaSenha.length < 6) {
      this.erro.set('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacao) {
      this.erro.set('As senhas não conferem.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.auth.redefinirSenha(codigo, novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.etapa.set('pronto');
      },
      error: (falha: unknown) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(falha, 'Não foi possível redefinir a senha. Tente novamente.'));
      },
    });
  }

  protected irParaEtapa(etapa: Etapa): void {
    this.erro.set(null);
    this.etapa.set(etapa);
  }
}
