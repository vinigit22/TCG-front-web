import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { configuracao } from '../core/configuracao';
import { authInterceptor } from '../core/http/auth.interceptor';
import { mockApiInterceptor } from '../core/http/mock-api.interceptor';
import { Jogos } from './jogos';

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// A página lê GET /jogos e /formatos pelo CatalogoService (aqui respondido pelo mock)
describe('Jogos', () => {
  beforeEach(async () => {
    configuracao.usarMockApi = true;
    await TestBed.configureTestingModule({
      imports: [Jogos],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor])),
      ],
    }).compileComponents();
  });

  it('mostra os jogos do catálogo com formatos, logo e link para os torneios', async () => {
    const fixture = TestBed.createComponent(Jogos);
    await esperar(400);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;
    const cartoes = [...tela.querySelectorAll<HTMLAnchorElement>('a.jogo-card')];

    expect(cartoes.map((cartao) => cartao.querySelector('h3')?.textContent?.trim())).toEqual([
      'Magic: The Gathering',
      'Pokemon TCG',
      'Yu-Gi-Oh!',
      'One Piece Card Game',
      'Digimon Card Game',
    ]);
    expect(cartoes[0].getAttribute('href')).toBe('/torneios?jogo=magic');
    expect(cartoes[0].textContent).toContain('Standard · Modern · Commander · Pauper');
    expect(cartoes[0].querySelector('img')?.getAttribute('src')).toBe('/imagens/jogo4.png');

    // Digimon: sem logo e sem formatos no catálogo
    expect(cartoes[4].querySelector('.jogo-sem-logo')?.textContent?.trim()).toBe('DC');
    expect(cartoes[4].textContent).toContain('Formato livre');
  });
});
