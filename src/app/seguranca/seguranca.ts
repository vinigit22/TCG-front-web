import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SessaoService } from '../core/services/sessao.service';
import { Avisos } from '../ui/avisos';
import { erroDoCampo } from '../ui/erros-form';
import { ROTULO_TIPO_CONTA, tempoRelativo } from '../ui/formatar';
import { Icone } from '../ui/icone';
import { recurso } from '../ui/recurso';

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const nova = grupo.get('novaSenha')?.value as string;
  const confirmar = grupo.get('confirmar')?.value as string;
  return confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
}

// Página "Segurança" do painel da loja e do admin: dados da conta, troca de senha e saída
@Component({
  selector: 'app-seguranca',
  imports: [ReactiveFormsModule, DatePipe, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seguranca.html',
  styleUrl: './seguranca.css',
})
export class Seguranca {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);
  protected readonly sessao = inject(SessaoService).conta;
  protected readonly conta = recurso(() => this.auth.contaLogada());
  protected readonly rotuloTipo = ROTULO_TIPO_CONTA;
  protected readonly tempoRelativo = tempoRelativo;

  protected readonly mostrarSenha = signal(false);
  protected readonly salvando = signal(false);
  protected readonly form = new FormGroup(
    {
      senhaAtual: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      novaSenha: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
      }),
      confirmar: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: senhasIguais },
  );

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected alterarSenha(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { senhaAtual, novaSenha } = this.form.getRawValue();
    this.salvando.set(true);
    this.auth.alterarSenha(senhaAtual, novaSenha).subscribe({
      next: () => {
        this.salvando.set(false);
        this.form.reset();
        this.avisos.sucesso(
          'Senha alterada',
          'As sessões abertas em outros navegadores foram encerradas.',
        );
      },
      error: (falha: unknown) => {
        this.salvando.set(false);
        this.avisos.erro(falha, 'Não foi possível alterar a senha');
      },
    });
  }

  protected sair(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
