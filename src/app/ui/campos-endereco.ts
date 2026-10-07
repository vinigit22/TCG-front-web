import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Endereco, EnderecoRequest } from '../core/models/api';
import { erroDoCampo } from './erros-form';

export type FormEndereco = FormGroup<{
  cep: FormControl<string>;
  logradouro: FormControl<string>;
  numero: FormControl<string>;
  complemento: FormControl<string>;
  bairro: FormControl<string>;
  cidade: FormControl<string>;
  estado: FormControl<string>;
  referencia: FormControl<string>;
}>;

// Mesmas regras do backend (EnderecoRequest): cep com 8 dígitos e estado com 2 letras
export function criarFormEndereco(): FormEndereco {
  const texto = (validadores: ReturnType<typeof Validators.maxLength>[] = []) =>
    new FormControl('', { nonNullable: true, validators: validadores });
  return new FormGroup({
    cep: texto([Validators.pattern(/^\d{5}-?\d{3}$/)]),
    logradouro: texto([Validators.required, Validators.maxLength(200)]),
    numero: texto([Validators.maxLength(20)]),
    complemento: texto([Validators.maxLength(100)]),
    bairro: texto([Validators.maxLength(100)]),
    cidade: texto([Validators.required, Validators.maxLength(120)]),
    estado: texto([Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]),
    referencia: texto([Validators.maxLength(255)]),
  });
}

export function preencherFormEndereco(form: FormEndereco, endereco: Endereco | null): void {
  form.reset({
    cep: endereco?.cep ?? '',
    logradouro: endereco?.logradouro ?? '',
    numero: endereco?.numero ?? '',
    complemento: endereco?.complemento ?? '',
    bairro: endereco?.bairro ?? '',
    cidade: endereco?.cidade ?? '',
    estado: endereco?.estado ?? '',
    referencia: endereco?.referencia ?? '',
  });
}

export function enderecoDoForm(form: FormEndereco): EnderecoRequest {
  const valor = form.getRawValue();
  const ouNulo = (texto: string) => texto.trim() || null;
  return {
    cep: ouNulo(valor.cep.replace(/\D/g, '')),
    logradouro: valor.logradouro.trim(),
    numero: ouNulo(valor.numero),
    complemento: ouNulo(valor.complemento),
    bairro: ouNulo(valor.bairro),
    cidade: valor.cidade.trim(),
    estado: valor.estado.trim().toUpperCase(),
    referencia: ouNulo(valor.referencia),
  };
}

// "Avenida Paulista, 1000 · Bela Vista, São Paulo/SP"
export function enderecoEmTexto(endereco: Endereco | null | undefined): string {
  if (!endereco) return '';
  const rua = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const cidade = [endereco.bairro, `${endereco.cidade}/${endereco.estado}`]
    .filter(Boolean)
    .join(', ');
  return `${rua} · ${cidade}`;
}

@Component({
  selector: 'app-campos-endereco',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-grade" [formGroup]="form()">
      <label class="campo">
        <span class="campo-rotulo">CEP <span class="opcional">(opcional)</span></span>
        <input
          class="controle"
          formControlName="cep"
          inputmode="numeric"
          placeholder="00000-000"
          maxlength="9"
        />
        @if (erro('cep', 'O CEP'); as mensagem) {
          <span class="campo-erro">{{
            mensagem === 'Formato inválido.' ? 'Use os 8 dígitos do CEP.' : mensagem
          }}</span>
        }
      </label>
      <label class="campo">
        <span class="campo-rotulo">Cidade</span>
        <input class="controle" formControlName="cidade" placeholder="São Paulo" />
        @if (erro('cidade', 'A cidade'); as mensagem) {
          <span class="campo-erro">{{ mensagem }}</span>
        }
      </label>
      <label class="campo inteiro">
        <span class="campo-rotulo">Logradouro</span>
        <input class="controle" formControlName="logradouro" placeholder="Avenida Paulista" />
        @if (erro('logradouro', 'O logradouro'); as mensagem) {
          <span class="campo-erro">{{ mensagem }}</span>
        }
      </label>
      <label class="campo">
        <span class="campo-rotulo">Número <span class="opcional">(opcional)</span></span>
        <input class="controle" formControlName="numero" placeholder="1000" />
      </label>
      <label class="campo">
        <span class="campo-rotulo">Complemento <span class="opcional">(opcional)</span></span>
        <input class="controle" formControlName="complemento" placeholder="Loja 12" />
      </label>
      <label class="campo">
        <span class="campo-rotulo">Bairro <span class="opcional">(opcional)</span></span>
        <input class="controle" formControlName="bairro" placeholder="Bela Vista" />
      </label>
      <label class="campo">
        <span class="campo-rotulo">Estado</span>
        <input class="controle" formControlName="estado" placeholder="SP" maxlength="2" />
        @if (erro('estado', 'O estado'); as mensagem) {
          <span class="campo-erro">{{
            mensagem === 'Formato inválido.' ? 'Use a sigla com 2 letras (SP).' : mensagem
          }}</span>
        }
      </label>
      <label class="campo inteiro">
        <span class="campo-rotulo"
          >Ponto de referência <span class="opcional">(opcional)</span></span
        >
        <input class="controle" formControlName="referencia" placeholder="Em frente ao metrô" />
      </label>
    </div>
  `,
})
export class CamposEndereco {
  readonly form = input.required<FormEndereco>();

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form().get(campo), rotulo);
  }
}
