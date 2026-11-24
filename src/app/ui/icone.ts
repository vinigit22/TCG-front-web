import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Ícones de traço (24x24, stroke 2). Cada ícone é uma lista de caminhos SVG.
const ICONES = {
  painel: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  trofeu: [
    'M8 21h8',
    'M12 17v4',
    'M7 4h10v5a5 5 0 0 1-10 0z',
    'M17 5h2a2 2 0 0 1 0 4h-2',
    'M7 5H5a2 2 0 0 0 0 4h2',
  ],
  calendario: [
    'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M3 10h18',
    'M8 2v4',
    'M16 2v4',
  ],
  usuarios: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  usuario: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z'],
  'usuario-check': [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z',
    'M16 11l2 2 4-4',
  ],
  'usuario-mais': [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z',
    'M19 8v6',
    'M22 11h-6',
  ],
  loja: ['M4 10v10h16V10', 'M2.5 10L4.5 4h15l2 6z', 'M9.5 20v-5h5v5'],
  sino: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  ajustes: [
    'M4 21v-7',
    'M4 10V3',
    'M12 21v-9',
    'M12 8V3',
    'M20 21v-5',
    'M20 12V3',
    'M1 14h6',
    'M9 8h6',
    'M17 16h6',
  ],
  cadeado: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  sair: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  mais: ['M12 5v14', 'M5 12h14'],
  busca: ['M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  'seta-esquerda': ['M19 12H5', 'M12 19l-7-7 7-7'],
  'seta-direita': ['M5 12h14', 'M12 5l7 7-7 7'],
  'chevron-direita': ['M9 18l6-6-6-6'],
  'chevron-baixo': ['M6 9l6 6 6-6'],
  check: ['M20 6L9 17l-5-5'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  editar: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
  lixeira: [
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  ],
  olho: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z'],
  'olho-fechado': [
    'M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94',
    'M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19',
    'M1 1l22 22',
    'M14.12 14.12a3 3 0 1 1-4.24-4.24',
  ],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  cartas: ['M12 2l9 5-9 5-9-5z', 'M3 12l9 5 9-5', 'M3 17l9 5 9-5'],
  chave: ['M3 4h5v6H3', 'M8 7h5', 'M3 14h5v6H3', 'M8 17h5', 'M13 7v10', 'M13 12h8'],
  dinheiro: ['M2 6h20v12H2z', 'M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z', 'M6 12h.01', 'M18 12h.01'],
  'cartao-credito': [
    'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    'M2 10h20',
    'M6 15h4',
  ],
  grafico: ['M3 3v18h18', 'M8 17v-4', 'M13 17V8', 'M18 17v-7'],
  tendencia: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  escudo: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  'escudo-check': ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  verificado: ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z', 'M8 12l3 3 5-6'],
  alerta: [
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  info: ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  relogio: ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  local: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6a3 3 0 0 0 0 6z'],
  atualizar: ['M21 12a9 9 0 1 1-2.64-6.36L21 8', 'M21 3v5h-5'],
  megafone: [
    'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z',
    'M16 8a5 5 0 0 1 0 8',
    'M19 5a9 9 0 0 1 0 14',
  ],
  servidor: ['M3 3h18v7H3z', 'M3 14h18v7H3z', 'M7 6.5h.01', 'M7 17.5h.01'],
  grade: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  estrela: [
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  ],
  externo: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  email: [
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M22 6l-10 7L2 6',
  ],
  jogar: ['M6 4l14 8-14 8z'],
  desfazer: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  bandeira: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  casa: ['M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  filtro: ['M22 3H2l8 9.46V19l4 2v-8.54z'],
  imagem: ['M3 3h18v18H3z', 'M8.5 10a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3z', 'M21 15l-5-5L5 21'],
  link: [
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  ],
  raio: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  presente: [
    'M20 12v10H4V12',
    'M2 7h20v5H2z',
    'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  ],
  copiar: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  pulso: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  pontos: [
    'M12 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z',
    'M19 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z',
    'M5 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2z',
  ],
  cancelar: ['M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z', 'M4.93 4.93l14.14 14.14'],
  pausa: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
} satisfies Record<string, string[]>;

export type NomeIcone = keyof typeof ICONES;

@Component({
  selector: 'app-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icone', 'aria-hidden': 'true' },
  template: `
    <svg
      [attr.width]="tamanho()"
      [attr.height]="tamanho()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="traco()"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (caminho of caminhos(); track $index) {
        <path [attr.d]="caminho" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }
  `,
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
  readonly tamanho = input(18);
  readonly traco = input(2);

  protected readonly caminhos = computed(() => ICONES[this.nome()]);
}
