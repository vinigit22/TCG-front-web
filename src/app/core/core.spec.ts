import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { configuracao } from './configuracao';
import { mensagemDeErro } from './erros';
import { authInterceptor } from './http/auth.interceptor';
import { mockApiInterceptor } from './http/mock-api.interceptor';
import { logoDoJogo } from './jogos';
import { AuthService } from './services/auth.service';
import { CatalogoService } from './services/catalogo.service';
import { InscricaoService } from './services/inscricao.service';
import { NotificacaoService } from './services/notificacao.service';
import { SessaoService } from './services/sessao.service';
import { TorneioService } from './services/torneio.service';

// Camada core no modo mock (configuracao.usarMockApi = true): os services, a sessão e os interceptors
// funcionam como funcionarão com a API, respondendo os dados de exemplo do backend.
describe('core (modo mock)', () => {
  beforeEach(() => {
    localStorage.clear();
    configuracao.usarMockApi = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor])),
      ],
    });
  });

  it('a loja entra e a sessão guarda o id da loja e o nome', async () => {
    const conta = await firstValueFrom(
      TestBed.inject(AuthService).login({ email: 'contato@cardhouse.com.br', senha: '123456' }),
    );

    expect(conta).toEqual({
      id: 1,
      email: 'contato@cardhouse.com.br',
      tipo: 'LOJA',
      nome: 'Card House',
      imagemPerfil: undefined,
    });
    expect(TestBed.inject(SessaoService).autenticado()).toBe(true);
    expect(TestBed.inject(SessaoService).token).toBe('mock.1');
  });

  it('conta de jogador não entra no painel', async () => {
    const tentativa = firstValueFrom(
      TestBed.inject(AuthService).login({ email: 'eric@email.com', senha: '123456' }),
    );

    await expect(tentativa).rejects.toThrow('Este painel é das lojas');
    expect(TestBed.inject(SessaoService).autenticado()).toBe(false);
  });

  it('senha errada vira a mensagem do backend', async () => {
    const erro = await firstValueFrom(
      TestBed.inject(AuthService).login({ email: 'contato@cardhouse.com.br', senha: 'errada' }),
    ).catch((e: unknown) => e);

    expect(mensagemDeErro(erro, 'padrão')).toBe('Email ou senha inválidos');
  });

  it('consultas devolvem os dados de exemplo no formato da API', async () => {
    const torneios = await firstValueFrom(
      TestBed.inject(TorneioService).listar({ lojaId: 1, status: ['INSCRICOES_ENCERRADAS'] }),
    );
    expect(torneios.map((t) => [t.id, t.titulo, t.vagasDisponiveis, t.loja.nome])).toEqual([
      [1, 'Standard Semanal', 0, 'Card House'],
    ]);

    const jogos = await firstValueFrom(TestBed.inject(CatalogoService).listarJogos(true));
    expect(jogos.map((jogo) => jogo.slug)).toEqual([
      'magic',
      'pokemon',
      'yugioh',
      'one-piece',
      'digimon',
    ]);
    expect(logoDoJogo(jogos[0])).toBe('/imagens/jogo4.png');
  });

  it('rotas protegidas exigem login, e o token vai sozinho depois do login', async () => {
    const semLogin = await firstValueFrom(
      TestBed.inject(InscricaoService).listarDoTorneio(1),
    ).catch((e: unknown) => e);
    expect((semLogin as HttpErrorResponse).status).toBe(401);

    await firstValueFrom(
      TestBed.inject(AuthService).login({ email: 'contato@cardhouse.com.br', senha: '123456' }),
    );
    const inscricoes = await firstValueFrom(TestBed.inject(InscricaoService).listarDoTorneio(1));
    expect(inscricoes.length).toBe(4);
    expect(await firstValueFrom(TestBed.inject(NotificacaoService).contarNaoLidas())).toBe(1);
  });

  it('alterações pedem a API real', async () => {
    await firstValueFrom(
      TestBed.inject(AuthService).login({ email: 'contato@cardhouse.com.br', senha: '123456' }),
    );
    const erro = await firstValueFrom(
      TestBed.inject(TorneioService).alterarStatus(1, 'CANCELADO'),
    ).catch((e: unknown) => e);

    expect((erro as HttpErrorResponse).status).toBe(503);
    expect(mensagemDeErro(erro, 'padrão')).toContain('usarMockApi');
  });

  it('logout encerra a sessão', async () => {
    const auth = TestBed.inject(AuthService);
    await firstValueFrom(auth.login({ email: 'admin@tcg.com', senha: 'admin123' }));
    await firstValueFrom(auth.logout(), { defaultValue: undefined });

    expect(TestBed.inject(SessaoService).autenticado()).toBe(false);
  });
});
