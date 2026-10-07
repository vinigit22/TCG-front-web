import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Administrador } from '../../core/models/api';
import { AdministradorService } from '../../core/services/administrador.service';
import { ContaService } from '../../core/services/conta.service';
import { SessaoService } from '../../core/services/sessao.service';
import { Avisos } from '../../ui/avisos';
import { Confirmacao } from '../../ui/confirmacao';
import { aplicarErrosDoServidor, erroDoCampo } from '../../ui/erros-form';
import { EstadoVazio } from '../../ui/estado-vazio';
import { iniciais, tempoRelativo } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { Modal } from '../../ui/modal';
import { recurso } from '../../ui/recurso';

@Component({
  selector: 'app-administradores',
  imports: [DatePipe, ReactiveFormsModule, Icone, EstadoVazio, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './administradores.html',
})
export class Administradores {
  private readonly servico = inject(AdministradorService);
  private readonly servicoContas = inject(ContaService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);
  private readonly idLogado = inject(SessaoService).conta()?.id;

  protected readonly administradores = recurso(() => this.servico.listar());
  private readonly contas = recurso(() => this.servicoContas.listar('ADMIN'));
  protected readonly iniciais = iniciais;
  protected readonly tempoRelativo = tempoRelativo;

  protected readonly criando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly editando = signal<Administrador | null>(null);

  protected readonly formNovo = new FormGroup({
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
  });
  protected readonly nomeEditado = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(150)],
  });

  protected readonly linhas = computed(() => {
    const contas = new Map((this.contas.dados() ?? []).map((conta) => [conta.id, conta]));
    return (this.administradores.dados() ?? []).map((admin) => ({
      admin,
      conta: contas.get(admin.contaId),
      voce: admin.contaId === this.idLogado,
    }));
  });

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.formNovo.get(campo), rotulo);
  }

  protected abrirNovo(): void {
    this.formNovo.reset();
    this.criando.set(true);
  }

  protected criar(): void {
    if (this.formNovo.invalid) {
      this.formNovo.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const dados = this.formNovo.getRawValue();
    this.servico
      .criar({ nome: dados.nome.trim(), email: dados.email.trim(), senha: dados.senha })
      .subscribe({
        next: (admin) => {
          this.salvando.set(false);
          this.criando.set(false);
          this.avisos.sucesso('Administrador criado', `${admin.nome} já pode entrar no painel.`);
          this.administradores.recarregar();
          this.contas.recarregar();
        },
        error: (falha: unknown) => {
          this.salvando.set(false);
          aplicarErrosDoServidor(this.formNovo, falha);
          this.avisos.erro(falha, 'Não foi possível criar');
        },
      });
  }

  protected abrirEdicao(admin: Administrador): void {
    this.nomeEditado.setValue(admin.nome);
    this.editando.set(admin);
  }

  protected renomear(): void {
    const admin = this.editando();
    if (!admin || this.nomeEditado.invalid) return;
    this.salvando.set(true);
    this.servico.atualizar(admin.contaId, { nome: this.nomeEditado.value.trim() }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.editando.set(null);
        this.avisos.sucesso('Nome atualizado');
        this.administradores.recarregar();
      },
      error: (falha: unknown) => {
        this.salvando.set(false);
        this.avisos.erro(falha);
      },
    });
  }

  protected async remover(admin: Administrador): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Remover administrador?',
      mensagem: `${admin.nome} perde o acesso ao admin geral.`,
      confirmar: 'Remover',
      perigo: true,
    });
    if (!sim) return;
    this.servico.excluir(admin.contaId).subscribe({
      next: () => {
        this.avisos.sucesso('Administrador removido');
        this.administradores.recarregar();
      },
      error: (falha: unknown) => this.avisos.erro(falha),
    });
  }
}
