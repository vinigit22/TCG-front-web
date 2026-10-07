import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Contas } from './admin/contas/contas';
import { tipoContaGuard } from './core/autenticado.guard';
import { configuracao } from './core/configuracao';
import { authInterceptor } from './core/http/auth.interceptor';
import { mockApiInterceptor } from './core/http/mock-api.interceptor';
import { Chaveamento, Inscricao, Torneio } from './core/models/api';
import { pagamentoLiberado } from './core/regras';
import { AuthService } from './core/services/auth.service';
import { Login } from './login/login';
import { AbaChave } from './painel/torneios/aba-chave';
import { AbaInscricoes } from './painel/torneios/aba-inscricoes';
import { VisaoGeral } from './painel/visao-geral/visao-geral';
import { ChaveVisual } from './ui/chave-visual';

@Component({ template: '' })
class Vazio {}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Painéis no modo mock: as telas carregam os dados de exemplo pelos mesmos services que usarão a API
describe('painéis (modo mock)', () => {
  beforeEach(() => {
    localStorage.clear();
    configuracao.usarMockApi = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'painel', component: Vazio },
          { path: 'admin', component: Vazio },
          { path: 'login', component: Vazio },
        ]),
        provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor])),
      ],
    });
  });

  async function entrar(email: string, senha: string) {
    return firstValueFrom(TestBed.inject(AuthService).login({ email, senha }));
  }

  function rodarGuard(tipo: 'LOJA' | 'ADMIN', url: string) {
    return TestBed.runInInjectionContext(() =>
      tipoContaGuard(tipo)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  it('o guard manda para o login sem sessão e para a área certa com outro tipo de conta', async () => {
    const router = TestBed.inject(Router);
    const semSessao = rodarGuard('ADMIN', '/admin/contas') as UrlTree;
    expect(router.serializeUrl(semSessao)).toBe('/login?voltar=%2Fadmin%2Fcontas');

    await entrar('contato@cardhouse.com.br', '123456');
    expect(router.serializeUrl(rodarGuard('ADMIN', '/admin') as UrlTree)).toBe('/painel');
    expect(rodarGuard('LOJA', '/painel')).toBe(true);
  });

  it('o login leva a loja para /painel e o admin para /admin', async () => {
    const router = TestBed.inject(Router);
    for (const [email, senha, destino] of [
      ['contato@cardhouse.com.br', '123456', '/painel'],
      ['admin@tcg.com', 'admin123', '/admin'],
    ]) {
      localStorage.clear();
      const fixture = TestBed.createComponent(Login);
      await fixture.whenStable();
      const tela = fixture.nativeElement as HTMLElement;
      const preencher = (seletor: string, valor: string) => {
        const campo = tela.querySelector<HTMLInputElement>(seletor)!;
        campo.value = valor;
        campo.dispatchEvent(new Event('input'));
      };
      preencher('#email', email);
      preencher('#senha', senha);
      tela.querySelector('form')!.dispatchEvent(new Event('submit'));
      await esperar(400);
      await fixture.whenStable();
      expect(router.url).toBe(destino);
      fixture.destroy();
    }
  });

  it('conta de jogador recebe o aviso de que o painel é das lojas', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;
    for (const [seletor, valor] of [
      ['#email', 'eric@email.com'],
      ['#senha', '123456'],
    ]) {
      const campo = tela.querySelector<HTMLInputElement>(seletor)!;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
    }
    tela.querySelector('form')!.dispatchEvent(new Event('submit'));
    await esperar(600);
    await fixture.whenStable();
    expect(tela.querySelector('.login-erro')?.textContent).toContain('Este painel é das lojas');
  });

  it('a visão geral da loja mostra o torneio e o que precisa ser feito', async () => {
    await entrar('contato@cardhouse.com.br', '123456');
    const fixture = TestBed.createComponent(VisaoGeral);
    await esperar(400);
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Card House');
    expect(texto).toContain('Standard Semanal');
    expect(texto).toContain('faça o check-in e gere a chave');
  });

  it('o admin vê todas as contas com o nome de cada perfil', async () => {
    await entrar('admin@tcg.com', 'admin123');
    const fixture = TestBed.createComponent(Contas);
    await esperar(400);
    await fixture.whenStable();
    const linhas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(linhas.length).toBe(6);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Eric Abreu');
  });

  it('a chave desenha as rodadas, o vencedor, o bye e o desempate pendente', async () => {
    const linha = (dados: Partial<Chaveamento>): Chaveamento => ({
      torneioId: 1,
      rodada: 1,
      nomeRodada: 'Semifinal',
      partidaId: 1,
      mesa: 1,
      jogadorA: null,
      jogadorB: null,
      gamesA: 0,
      gamesB: 0,
      resultado: null,
      vencedor: null,
      status: 'AGUARDANDO',
      ...dados,
    });
    const fixture = TestBed.createComponent(ChaveVisual);
    fixture.componentRef.setInput('linhas', [
      linha({
        partidaId: 1,
        mesa: 1,
        jogadorA: 'ericabreu',
        jogadorB: 'lucassz',
        gamesA: 2,
        gamesB: 1,
        resultado: 'VITORIA_A',
        vencedor: 'ericabreu',
        status: 'FINALIZADA',
      }),
      linha({
        partidaId: 2,
        mesa: 2,
        jogadorA: 'sambarbosa',
        jogadorB: null,
        resultado: 'VITORIA_A',
        vencedor: 'sambarbosa',
        status: 'FINALIZADA',
      }),
      linha({
        partidaId: 3,
        rodada: 2,
        nomeRodada: 'Final',
        jogadorA: 'ericabreu',
        jogadorB: 'sambarbosa',
        gamesA: 1,
        gamesB: 1,
        resultado: 'EMPATE',
        status: 'EM_ANDAMENTO',
      }),
    ]);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;

    expect([...tela.querySelectorAll('h4')].map((titulo) => titulo.textContent?.trim())).toEqual([
      'Semifinal',
      'Final',
    ]);
    expect(
      [...tela.querySelectorAll('.vencedor .nome')].map((nome) => nome.textContent?.trim()),
    ).toEqual(['ericabreu', 'sambarbosa']);
    expect(tela.textContent).toContain('sem adversário');
    expect(tela.querySelector('.desempate .estado')?.textContent).toContain('Desempate');
  });

  it('depois da chave gerada, as inscrições ficam travadas (sem check-in)', async () => {
    const torneio = { id: 1, status: 'EM_ANDAMENTO', taxaInscricao: 0 } as Torneio;
    const inscricao = {
      id: 1,
      status: 'INSCRITO',
      pagamentoStatus: 'PENDENTE',
      inscritoEm: '2026-10-05T09:00:00',
      checkInEm: null,
      jogador: { contaId: 2, nome: 'Eric Abreu', nickname: 'ericabreu', imagemPerfil: null },
    } as unknown as Inscricao;
    const fixture = TestBed.createComponent(AbaInscricoes);
    fixture.componentRef.setInput('torneio', torneio);
    fixture.componentRef.setInput('inscricoes', [inscricao]);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;

    expect(tela.textContent).toContain('A chave já foi gerada');
    // Nenhuma ação na linha do jogador (check-in, cancelar...) e nada de inscrever novos
    expect(tela.querySelectorAll('tbody tr').length).toBe(1);
    expect(tela.querySelectorAll('tbody button').length).toBe(0);
    expect(
      [...tela.querySelectorAll('button')].some((botao) =>
        botao.textContent?.includes('Inscrever jogador'),
      ),
    ).toBe(false);
  });

  it('só pagamento PAGO ou ISENTO libera o check-in', () => {
    expect(pagamentoLiberado('PAGO')).toBe(true);
    expect(pagamentoLiberado('ISENTO')).toBe(true);
    expect(pagamentoLiberado('PENDENTE')).toBe(false);
    expect(pagamentoLiberado('REEMBOLSADO')).toBe(false);
  });

  it('o check-in de quem não pagou fica destacado e a regra aparece na aba', async () => {
    const torneio = { id: 1, status: 'INSCRICOES_ENCERRADAS', taxaInscricao: 25 } as Torneio;
    const inscricao = (id: number, pagamentoStatus: string) =>
      ({
        id,
        status: 'INSCRITO',
        pagamentoStatus,
        inscritoEm: '2026-10-05T09:00:00',
        checkInEm: null,
        jogador: {
          contaId: id + 1,
          nome: `Jogador ${id}`,
          nickname: `jogador${id}`,
          imagemPerfil: null,
        },
      }) as unknown as Inscricao;
    const fixture = TestBed.createComponent(AbaInscricoes);
    fixture.componentRef.setInput('torneio', torneio);
    fixture.componentRef.setInput('inscricoes', [inscricao(1, 'PAGO'), inscricao(2, 'PENDENTE')]);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;

    expect(tela.textContent).toContain('Só entra na chave quem pagou');
    const checkIns = [...tela.querySelectorAll('tbody button')].filter((botao) =>
      botao.textContent?.includes('Check-in'),
    );
    expect(checkIns.map((botao) => botao.classList.contains('pendente'))).toEqual([false, true]);
  });

  it('a chave não pode ser gerada com check-in sem pagamento', async () => {
    const fixture = TestBed.createComponent(AbaChave);
    fixture.componentRef.setInput('torneio', { id: 1, status: 'INSCRICOES_ENCERRADAS' } as Torneio);
    fixture.componentRef.setInput('linhas', []);
    fixture.componentRef.setInput('confirmados', 3);
    fixture.componentRef.setInput('semPagamento', ['@lucassz']);
    await fixture.whenStable();
    const tela = fixture.nativeElement as HTMLElement;
    const gerar = () =>
      [...tela.querySelectorAll('button')].find((botao) =>
        botao.textContent?.includes('Sortear e gerar chave'),
      ) as HTMLButtonElement;

    expect(tela.textContent).toContain('Pagamento pendente de @lucassz');
    expect(gerar().disabled).toBe(true);

    fixture.componentRef.setInput('semPagamento', []);
    await fixture.whenStable();
    expect(gerar().disabled).toBe(false);
  });
});
