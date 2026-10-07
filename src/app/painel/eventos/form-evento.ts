import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { Evento, EventoRequest, StatusEvento, TipoEvento } from '../../core/models/api';
import { ROTULOS_STATUS_EVENTO, ROTULOS_TIPO_EVENTO } from '../../core/rotulos';
import { CatalogoService } from '../../core/services/catalogo.service';
import { EventoService } from '../../core/services/evento.service';
import { LojaService } from '../../core/services/loja.service';
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
import { idDaLojaLogada } from '../loja-atual';
import { ICONE_TIPO_EVENTO } from './evento-util';

// Mesma regra do backend: o fim não pode ser antes do início
function fimDepoisDoInicio(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('dataInicio')?.value as string;
  const fim = grupo.get('dataFim')?.value as string;
  return inicio && fim && fim < inicio ? { fimAntesDoInicio: true } : null;
}

@Component({
  selector: 'app-form-evento',
  imports: [ReactiveFormsModule, RouterLink, Icone, CamposEndereco],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-evento.html',
  styles: `
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
    }
    legend {
      padding: 0;
      margin-bottom: 0.4rem;
    }
    .tipos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.5rem;
    }
    .tipos .opcao span {
      width: 100%;
      height: 44px;
    }
    .formulario {
      max-width: 920px;
    }
  `,
})
export class FormEvento {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(EventoService);
  private readonly catalogo = inject(CatalogoService);
  private readonly lojas = inject(LojaService);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly id = numeroOuUndefined(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly tipos = Object.keys(ROTULOS_TIPO_EVENTO) as TipoEvento[];
  protected readonly statusPossiveis = Object.keys(ROTULOS_STATUS_EVENTO) as StatusEvento[];
  protected readonly rotuloTipo = ROTULOS_TIPO_EVENTO;
  protected readonly rotuloStatus = ROTULOS_STATUS_EVENTO;
  protected readonly iconeTipo = ICONE_TIPO_EVENTO;
  protected readonly enderecoEmTexto = enderecoEmTexto;

  protected readonly form = new FormGroup(
    {
      titulo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(180)],
      }),
      tipo: new FormControl<TipoEvento>('TROCA', { nonNullable: true }),
      descricao: new FormControl('', { nonNullable: true }),
      imagem: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
      dataInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dataFim: new FormControl('', { nonNullable: true }),
      vagasMax: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
      status: new FormControl<StatusEvento>('PUBLICADO', { nonNullable: true }),
      local: new FormControl<'loja' | 'outro'>('loja', { nonNullable: true }),
    },
    { validators: fimDepoisDoInicio },
  );
  protected readonly endereco = criarFormEndereco();
  protected readonly local = toSignal(this.form.controls.local.valueChanges, {
    initialValue: 'loja' as const,
  });

  protected readonly evento = recurso<Evento | null>(() =>
    this.id ? this.servico.buscar(this.id) : of(null),
  );
  protected readonly loja = recurso(() => this.lojas.buscar(this.lojaId));
  protected readonly salvando = signal(false);

  constructor() {
    effect(() => {
      const evento = this.evento.dados();
      if (!evento) return;
      this.form.reset({
        titulo: evento.titulo,
        tipo: evento.tipo,
        descricao: evento.descricao ?? '',
        imagem: evento.imagem ?? '',
        dataInicio: paraCampoDataHora(evento.dataInicio),
        dataFim: paraCampoDataHora(evento.dataFim),
        vagasMax: evento.vagasMax,
        status: evento.status,
        local: evento.endereco ? 'outro' : 'loja',
      });
      preencherFormEndereco(this.endereco, evento.endereco);
    });
  }

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected salvar(): void {
    const outroLocal = this.form.controls.local.value === 'outro';
    if (this.form.invalid || (outroLocal && this.endereco.invalid)) {
      this.form.markAllAsTouched();
      this.endereco.markAllAsTouched();
      this.avisos.info('Confira os campos destacados');
      return;
    }
    this.salvando.set(true);
    const atual = this.evento.dados();
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
      )
      .subscribe({
        next: (evento) => {
          this.avisos.sucesso(
            this.id ? 'Evento atualizado' : 'Evento criado',
            this.id ? 'Quem confirmou presença recebe o aviso no app.' : undefined,
          );
          this.router.navigate(['/painel/eventos', evento.id]);
        },
        error: (falha: unknown) => {
          this.salvando.set(false);
          aplicarErrosDoServidor(this.form, falha);
          this.avisos.erro(falha, 'Não foi possível salvar o evento');
        },
      });
  }

  private dados(enderecoId: number | null): EventoRequest {
    const valor = this.form.getRawValue();
    return {
      titulo: valor.titulo.trim(),
      descricao: valor.descricao.trim() || null,
      imagem: valor.imagem.trim() || null,
      tipo: valor.tipo,
      vagasMax: valor.vagasMax ? Number(valor.vagasMax) : null,
      enderecoId,
      dataInicio: deCampoDataHora(valor.dataInicio)!,
      dataFim: deCampoDataHora(valor.dataFim),
      status: valor.status,
    };
  }
}

function numeroOuUndefined(valor: string | null): number | undefined {
  return valor ? Number(valor) : undefined;
}
