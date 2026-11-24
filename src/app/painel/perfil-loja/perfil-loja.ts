import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable, of, switchMap } from 'rxjs';
import { urlImagem } from '../../core/configuracao';
import { LojaRequest } from '../../core/models/api';
import { CatalogoService } from '../../core/services/catalogo.service';
import { LojaService } from '../../core/services/loja.service';
import { SessaoService } from '../../core/services/sessao.service';
import { Avisos } from '../../ui/avisos';
import {
  CamposEndereco,
  criarFormEndereco,
  enderecoDoForm,
  preencherFormEndereco,
} from '../../ui/campos-endereco';
import { aplicarErrosDoServidor, erroDoCampo } from '../../ui/erros-form';
import { gerarSlug, iniciais } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';
import { idDaLojaLogada } from '../loja-atual';

@Component({
  selector: 'app-perfil-loja',
  imports: [ReactiveFormsModule, Icone, CamposEndereco],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil-loja.html',
  styleUrl: './perfil-loja.css',
})
export class PerfilLoja {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(LojaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly sessao = inject(SessaoService);
  private readonly avisos = inject(Avisos);

  protected readonly loja = recurso(() => this.servico.buscar(this.lojaId));
  protected readonly salvando = signal(false);
  protected readonly iniciais = iniciais;

  protected readonly form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
    descricao: new FormControl('', { nonNullable: true }),
    telefone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    imagemPerfil: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    imagemBanner: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    temEndereco: new FormControl(true, { nonNullable: true }),
  });
  protected readonly endereco = criarFormEndereco();

  protected readonly valores = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );
  private readonly valoresEndereco = toSignal(
    this.endereco.valueChanges.pipe(map(() => this.endereco.getRawValue())),
    {
      initialValue: this.endereco.getRawValue(),
    },
  );

  // Slug vazio: o backend mantém o atual
  protected readonly slugPrevia = computed(() => {
    const valor = this.valores();
    return gerarSlug(valor.slug || valor.nome) || 'sua-loja';
  });

  protected readonly previa = computed(() => {
    const valor = this.valores();
    const endereco = this.valoresEndereco();
    return {
      nome: valor.nome.trim() || 'Nome da loja',
      descricao: valor.descricao.trim(),
      perfil: urlImagem(valor.imagemPerfil.trim() || null),
      banner: urlImagem(valor.imagemBanner.trim() || null),
      cidade:
        valor.temEndereco && endereco.cidade
          ? `${endereco.cidade}/${endereco.estado.toUpperCase()}`
          : null,
    };
  });

  constructor() {
    effect(() => {
      const loja = this.loja.dados();
      if (!loja) return;
      this.form.reset({
        nome: loja.nome,
        slug: loja.slug,
        descricao: loja.descricao ?? '',
        telefone: loja.telefone ?? '',
        imagemPerfil: loja.imagemPerfil ?? '',
        imagemBanner: loja.imagemBanner ?? '',
        temEndereco: !!loja.endereco,
      });
      preencherFormEndereco(this.endereco, loja.endereco);
    });
  }

  protected erro(campo: string, rotulo: string): string | null {
    return erroDoCampo(this.form.get(campo), rotulo);
  }

  protected salvar(): void {
    const comEndereco = this.form.controls.temEndereco.value;
    if (this.form.invalid || (comEndereco && this.endereco.invalid)) {
      this.form.markAllAsTouched();
      this.endereco.markAllAsTouched();
      this.avisos.info('Confira os campos destacados');
      return;
    }
    this.salvando.set(true);
    const atual = this.loja.dados()?.endereco;
    const enderecoId$: Observable<number | null> = comEndereco
      ? (atual
          ? this.catalogo.atualizarEndereco(atual.id, enderecoDoForm(this.endereco))
          : this.catalogo.criarEndereco(enderecoDoForm(this.endereco))
        ).pipe(map((endereco) => endereco.id))
      : of(null);

    enderecoId$
      .pipe(switchMap((enderecoId) => this.servico.atualizar(this.lojaId, this.dados(enderecoId))))
      .subscribe({
        next: (loja) => {
          this.salvando.set(false);
          this.loja.definir(loja);
          this.sessao.atualizarConta({
            nome: loja.nome,
            imagemPerfil: loja.imagemPerfil ?? undefined,
          });
          this.avisos.sucesso('Perfil salvo', 'As mudanças já aparecem no app.');
        },
        error: (falha: unknown) => {
          this.salvando.set(false);
          aplicarErrosDoServidor(this.form, falha);
          this.avisos.erro(falha, 'Não foi possível salvar o perfil');
        },
      });
  }

  // PUT /lojas/{id} substitui o perfil inteiro: todos os campos vão juntos
  private dados(enderecoId: number | null): LojaRequest {
    const valor = this.form.getRawValue();
    const ouNulo = (texto: string) => texto.trim() || null;
    return {
      nome: valor.nome.trim(),
      slug: ouNulo(valor.slug),
      descricao: ouNulo(valor.descricao),
      telefone: ouNulo(valor.telefone),
      imagemPerfil: ouNulo(valor.imagemPerfil),
      imagemBanner: ouNulo(valor.imagemBanner),
      enderecoId,
    };
  }
}
