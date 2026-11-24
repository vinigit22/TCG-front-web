import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ProblemDetail } from '../core/models/api';

// Os 400 de validação do backend trazem "erros": { campo: mensagem }. Cada mensagem vai para o
// campo do formulário com o mesmo nome (erro "servidor"). Devolve true se algum campo recebeu erro.
export function aplicarErrosDoServidor(form: FormGroup, falha: unknown): boolean {
  if (!(falha instanceof HttpErrorResponse)) return false;
  const erros = (falha.error as ProblemDetail | null)?.erros;
  if (!erros) return false;

  let aplicou = false;
  for (const [campo, mensagem] of Object.entries(erros)) {
    const controle = form.get(campo);
    if (controle) {
      controle.setErrors({ ...controle.errors, servidor: mensagem });
      controle.markAsTouched();
      aplicou = true;
    }
  }
  return aplicou;
}

// Mensagem do primeiro erro de um campo, para mostrar embaixo dele (só depois de tocado)
export function erroDoCampo(
  controle: AbstractControl | null,
  rotulo = 'Este campo',
): string | null {
  if (!controle || !controle.errors || !(controle.touched || controle.dirty)) return null;
  const erros = controle.errors;
  if (erros['servidor']) return erros['servidor'] as string;
  if (erros['required']) return `${rotulo} é obrigatório.`;
  if (erros['email']) return 'Informe um email válido.';
  if (erros['minlength']) return `Use pelo menos ${erros['minlength'].requiredLength} caracteres.`;
  if (erros['maxlength']) return `Use no máximo ${erros['maxlength'].requiredLength} caracteres.`;
  if (erros['min']) return `O mínimo é ${erros['min'].min}.`;
  if (erros['max']) return `O máximo é ${erros['max'].max}.`;
  if (erros['pattern']) return 'Formato inválido.';
  if (erros['mensagem']) return erros['mensagem'] as string;
  return 'Valor inválido.';
}
