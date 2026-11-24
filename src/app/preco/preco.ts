import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLANOS } from '../compartilhado/planos';

@Component({
  selector: 'app-preco',
  imports: [RouterLink, CurrencyPipe, UpperCasePipe],
  templateUrl: './preco.html',
  styleUrl: './preco.css',
})
export class Preco {
  // A mesma lista que o admin usa em Planos e assinaturas (compartilhado/planos.ts)
  protected readonly planos = PLANOS;
}
