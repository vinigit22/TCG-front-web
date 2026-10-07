import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, of, switchMap } from 'rxjs';
import { Jogo, Torneio, TorneioRequest } from '../../core/models/api';
import { podeAlterarTorneio, VAGAS_PERMITIDAS } from '../../core/regras';
import { CatalogoService } from '../../core/services/catalogo.service';
import { LojaService } from '../../core/services/loja.service';
import { TorneioService } from '../../core/services/torneio.service';
import { Avisos } from '../../ui/avisos';
import {
  CamposEndereco,
  criarFormEndereco,
  enderecoDoForm,
  enderecoEmTexto,
  preencherFormEndereco,
} from '../../ui/campos-endereco';
import { aplicarErrosDoServidor, erroDoCampo } from '../../ui/erros-form';
import { deCampoDataHora, paraCampoDataHora } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';
import { SeloTorneio } from '../../ui/selo-status';
import { idDaLojaLogada } from '../loja-atual';

// Mesma regra do backend: o prazo de inscrição não pode ser depois do início
function prazoAntesDoInicio(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('dataInicio')?.value as string;
  const prazo = grupo.get('inscricoesAte')?.value as string;
  return inicio && prazo && prazo > inicio ? { prazoDepoisDoInicio: true } : null;
}

@Component({
  selector: 'app-form-torneio',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    Icone,
    CamposEndereco,
    SeloTorneio,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-torneio.html',
  styleUrl: './form-torneio.css',
})
export class FormTorneio {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(TorneioService);
  private readonly catalogo = inject(CatalogoService);
  private readonly lojas = inject(LojaService);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  // undefined = torneio novo
  protected readonly id = numeroOuUndefined(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly vagasPermitidas = VAGAS_PERMITIDAS;

  protected readonly form = new FormGroup(
    {
      titulo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(180)],
      }),
      jogoId: new FormControl<number | null>(null, { validators: [Validators.required] }),
      formatoId: new FormControl<number | null>(null),
      descricao: new FormControl('', { nonNullable: true }),
      imagem: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
      dataInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      inscricoesAte: new FormControl('', { nonNullable: true }),
      vagasMax: new FormControl(16, { nonNullable: true, validators: [Validators.required] }),
      taxaInscricao: new FormControl<number | null>(0, { validators: [Validators.min(0)] }),
      premiacao: new FormControl('', { nonNullable: true }),
      local: new FormControl<'loja' | 'outro'>('loja', { nonNullable: true }),
    },
    { validators: prazoAntesDoInicio },
  );
  protected readonly endereco = criarFormEndereco();

  protected readonly valores = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly torneio = recurso<Torneio | null>(() =>
    this.id ? this.servico.buscar(this.id) : of(null),
  );
  protected readonly loja = recurso(() => this.lojas.buscar(this.lojaId));
  private readonly jogosAtivos = recurso(() => this.catalogo.listarJogos(true));
  private readonly todosFormatos = recurso(() => this.catalogo.listarFormatos());

  // Jogos ativos + o jogo atual do torneio (caso tenha sido desativado depois)
  protected readonly jogos = computed<Jogo[]>(() => {
    const lista = [...(this.jogosAtivos.dados() ?? [])];
    const atual = this.torneio.dados()?.jogo;
    if (atual && !lista.some((jogo) => jogo.id === atual.id)) lista.push(atual);
    return lista;
  });

  protected readonly formatos = computed(() => {
    const jogoId = this.valores().jogoId;
    const atual = this.torneio.dados()?.formato?.id;
    return (this.todosFormatos.dados() ?? []).filter(
      (formato) => formato.jogo.id === jogoId && (formato.ativo || formato.id === atual),
    );
  });

  protected readonly bloqueado = computed(() => {
    const torneio = this.torneio.dados();
    return !!torneio && !podeAlterarTorneio(torneio.status);
  });

  protected readonly salvando = signal<'rascunho' | 'abrir' | null>(null);
  protected readonly enderecoEmTexto = enderecoEmTexto;

  // Prévia do cartão do app
  protected readonly previa = computed(() => {
    const valor = this.valores();
    return {
      titulo: valor.titulo.trim() || 'Nome do torneio',
      jogo: this.jogos().find((jogo) => jogo.id === Number(valor.jogoId))?.nome ?? 'Jogo',
      formato: this.formatos().find((formato) => formato.id === Number(valor.formatoId))?.nome,
      data: deCampoDataHora(valor.dataInicio),
      vagas: valor.vagasMax,
      taxa: Number(valor.taxaInscricao) || 0,
      premiacao: valor.premiacao.trim(),
    };
  });

  constructor() {
    // Ao editar, preenche o formulário quando o torneio chega
    effect(() => {
      const torneio = this.torneio.dados();
      if (!torneio) return;
      this.form.reset({
        titulo: torneio.titulo,
        jogoId: torneio.jogo.id,
        formatoId: torneio.formato?.id ?? null,
        descricao: torneio.descricao ?? '',
        imagem: torneio.imagem ?? '',
        dataInicio: paraCampoDataHora(torneio.dataInicio),
        inscricoesAte: paraCampoDataHora(torneio.inscricoesAte),
        vagasMax: torneio.vagasMax,
        taxaInscricao: torneio.taxaInscricao,
        premiacao: torneio.premiacao ?? '',
        local: torneio.endereco ? 'outro' : 'loja',
      });
      preencherFormEndereco(this.endereco, torneio.endereco);
      if (!podeAlterarTorneio(torneio.status)) this.form.disable();
    });

    // Trocar o jogo limpa um formato que não é dele
    this.form.controls.jogoId.valueChanges.pipe(takeUntilDestroyed()).subscribe((jogoId) => {
      const formatoId = this.form.controls.formatoId.value;
      const formato = this.todosFormatos.dados()?.find((item) => item.id === formatoId);
      if (formato && formato.jogo.id !== Number(jogoId))
        this.form.controls.formatoId.setValue(null);
    });
  }

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected salvar(abrirInscricoes: boolean): void {
    const outroLocal = this.form.controls.local.value === 'outro';
    if (this.form.invalid || (outroLocal && this.endereco.invalid)) {
      this.form.markAllAsTouched();
      this.endereco.markAllAsTouched();
      this.avisos.info(
        'Confira os campos destacados',
        'Alguns dados obrigatórios estão faltando ou inválidos.',
      );
      return;
    }

    this.salvando.set(abrirInscricoes ? 'abrir' : 'rascunho');
    const atual = this.torneio.dados();
    const enderecoId$: Observable<number | null> = outroLocal
      ? (atual?.endereco
          ? this.catalogo.atualizarEndereco(atual.endereco.id, enderecoDoForm(this.endereco))
          : this.catalogo.criarEndereco(enderecoDoForm(this.endereco))
        ).pipe(map((endereco) => endereco.id))
      : of(null);

    enderecoId$
      .pipe(
        switchMap((enderecoId) => {
          const dados = this.dados(enderecoId);
          return this.id
            ? this.servico.atualizar(this.id, dados)
            : this.servico.criar({ ...dados, lojaId: this.lojaId });
        }),
        switchMap((torneio) =>
          abrirInscricoes && torneio.status === 'RASCUNHO'
            ? this.servico.alterarStatus(torneio.id, 'INSCRICOES_ABERTAS')
            : of(torneio),
        ),
      )
      .subscribe({
        next: (torneio) => {
          this.avisos.sucesso(
            this.id ? 'Torneio atualizado' : 'Torneio criado',
            torneio.status === 'INSCRICOES_ABERTAS' && abrirInscricoes
              ? 'As inscrições estão abertas no app.'
              : undefined,
          );
          this.router.navigate(['/painel/torneios', torneio.id]);
        },
        error: (falha: unknown) => {
          this.salvando.set(null);
          aplicarErrosDoServidor(this.form, falha);
          this.avisos.erro(falha, 'Não foi possível salvar o torneio');
        },
      });
  }

  private dados(enderecoId: number | null): TorneioRequest {
    const valor = this.form.getRawValue();
    return {
      jogoId: Number(valor.jogoId),
      formatoId: valor.formatoId ? Number(valor.formatoId) : null,
      titulo: valor.titulo.trim(),
      descricao: valor.descricao.trim() || null,
      imagem: valor.imagem.trim() || null,
      vagasMax: Number(valor.vagasMax),
      taxaInscricao: Number(valor.taxaInscricao) || 0,
      premiacao: valor.premiacao.trim() || null,
      enderecoId,
      inscricoesAte: deCampoDataHora(valor.inscricoesAte),
      dataInicio: deCampoDataHora(valor.dataInicio)!,
    };
  }
}

function numeroOuUndefined(valor: string | null): number | undefined {
  return valor ? Number(valor) : undefined;
}
