import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { configuracao } from '../core/configuracao';
import { authInterceptor } from '../core/http/auth.interceptor';
import { mockApiInterceptor } from '../core/http/mock-api.interceptor';
import { Torneios } from './torneios';

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// A página lê GET /torneios pelo TorneioService (aqui respondido pelo mock)
describe('Torneios', () => {
  beforeEach(() => {
    configuracao.usarMockApi = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'torneios', component: Torneios }]),
        provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor])),
      ],
    });
  });

  async function abrir(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create(url);
    await esperar(400);
    harness.detectChanges();
    await harness.fixture.whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  it('mostra os torneios vindos do service', async () => {
    const tela = await abrir('/torneios');
    const texto = tela.textContent ?? '';

    expect(tela.querySelectorAll('.torneio-card').length).toBe(1);
    expect(texto).toContain('Standard Semanal');
    expect(texto).toContain('Card House');
    expect(texto).toContain('05 Set 2026 · 19h');
    expect(texto).toContain('4/4 vagas');
    // A formatação de moeda usa espaço não separável entre "R$" e o valor
    expect(texto).toMatch(/R\$\s25(?!,)/);
    // O mesmo selo de status dos painéis e do app
    expect(texto).toContain('Inscrições encerradas');
    expect(tela.querySelector('.torneio-card .selo')?.classList).toContain('selo-ambar');
  });

  it('filtra pelo jogo da URL', async () => {
    const tela = await abrir('/torneios?jogo=pokemon');
    const texto = tela.textContent ?? '';

    expect(texto).toContain('Torneios de Pokemon TCG');
    expect(tela.querySelectorAll('.torneio-card').length).toBe(0);
    expect(texto).toContain('Nenhum torneio aberto no momento.');
  });
});
