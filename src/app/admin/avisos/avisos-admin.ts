import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, from, map, mergeMap, of, tap, toArray } from 'rxjs';
import { Conta } from '../../core/models/api';
import { ContaService } from '../../core/services/conta.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { Avisos } from '../../ui/avisos';
import { Confirmacao } from '../../ui/confirmacao';
import { erroDoCampo } from '../../ui/erros-form';
import { ROTULO_TIPO_CONTA } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';

type Publico = 'LOJAS' | 'JOGADORES' | 'TODOS' | 'UMA';

// A API não tem envio em massa: uma chamada POST /notificacoes por conta, no máximo 4 ao mesmo tempo
const ENVIOS_SIMULTANEOS = 4;

@Component({
  selector: 'app-avisos-admin',
  imports: [ReactiveFormsModule, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avisos-admin.html',
  styleUrl: './avisos-admin.css',
})
export class AvisosAdmin {
  private readonly servicoContas = inject(ContaService);
  private readonly notificacoes = inject(NotificacaoService);
  private readonly avisos = inject(Avisos);
  private readonly confirmacao = inject(Confirmacao);

  protected readonly contas = recurso(() => this.servicoContas.listar());
  protected readonly rotuloTipo = ROTULO_TIPO_CONTA;

  protected readonly form = new FormGroup({
    publico: new FormControl<Publico>('LOJAS', { nonNullable: true }),
    contaId: new FormControl<number | null>(null),
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    mensagem: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });
  protected readonly valores = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly enviando = signal(false);
  protected readonly progresso = signal({ enviados: 0, total: 0 });
  protected readonly ultimoEnvio = signal<{ total: number; falhas: number; titulo: string } | null>(
    null,
  );

  protected readonly opcoes: {
    id: Publico;
    rotulo: string;
    icone: 'loja' | 'usuarios' | 'megafone' | 'usuario';
  }[] = [
    { id: 'LOJAS', rotulo: 'Todas as lojas', icone: 'loja' },
    { id: 'JOGADORES', rotulo: 'Todos os jogadores', icone: 'usuarios' },
    { id: 'TODOS', rotulo: 'Todas as contas', icone: 'megafone' },
    { id: 'UMA', rotulo: 'Uma conta', icone: 'usuario' },
  ];

  // Só contas ativas recebem
  protected readonly ativas = computed(() =>
    (this.contas.dados() ?? []).filter((conta) => conta.ativo),
  );

  protected readonly destinatarios = computed<Conta[]>(() => {
    const valor = this.valores();
    const ativas = this.ativas();
    switch (valor.publico) {
      case 'LOJAS':
        return ativas.filter((conta) => conta.tipo === 'LOJA');
      case 'JOGADORES':
        return ativas.filter((conta) => conta.tipo === 'JOGADOR');
      case 'TODOS':
        return ativas;
      case 'UMA':
        return ativas.filter((conta) => conta.id === Number(valor.contaId));
    }
  });

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid || this.destinatarios().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const destinatarios = this.destinatarios();
    const { titulo, mensagem } = this.form.getRawValue();
    const sim = await this.confirmacao.perguntar({
      titulo: 'Enviar aviso?',
      mensagem: `"${titulo}" vai para ${destinatarios.length} ${destinatarios.length === 1 ? 'conta' : 'contas'}. Não dá para apagar depois do envio.`,
      confirmar: `Enviar para ${destinatarios.length}`,
    });
    if (!sim) return;

    this.enviando.set(true);
    this.progresso.set({ enviados: 0, total: destinatarios.length });
    from(destinatarios)
      .pipe(
        mergeMap(
          (conta) =>
            this.notificacoes
              .enviar({
                contaId: conta.id,
                tipo: 'AVISO_GERAL',
                titulo: titulo.trim(),
                mensagem: mensagem.trim(),
              })
              .pipe(
                map(() => true),
                catchError(() => of(false)),
                tap(() =>
                  this.progresso.update((atual) => ({ ...atual, enviados: atual.enviados + 1 })),
                ),
              ),
          ENVIOS_SIMULTANEOS,
        ),
        toArray(),
      )
      .subscribe((resultados) => {
        const falhas = resultados.filter((ok) => !ok).length;
        this.enviando.set(false);
        this.ultimoEnvio.set({ total: resultados.length, falhas, titulo });
        if (falhas === resultados.length) {
          this.avisos.erro(null, 'Nenhum aviso foi enviado');
        } else {
          this.avisos.sucesso(
            'Aviso enviado',
            `${resultados.length - falhas} de ${resultados.length} contas receberam.`,
          );
          this.form.patchValue({ titulo: '', mensagem: '' });
          this.form.markAsUntouched();
        }
      });
  }
}
