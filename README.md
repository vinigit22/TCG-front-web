# TCG Torneios — painel web

Painel (Angular 21) para lojas criarem e administrarem torneios e eventos de card game, e para o administrador da plataforma. Jogadores não usam o painel; eles usam o app mobile.

## Como rodar

```bash
npm ci
npm start          # http://localhost:4200
```

Outros comandos: `npm run build` (gera `dist/`, com pré-renderização das páginas públicas) e `npm test` (Vitest).

## Dados: mock ou API

Tudo fica em `src/app/core/configuracao.ts`:

| Campo | Para que serve |
|---|---|
| `usarMockApi` | `true` (padrão): o painel responde com os dados de exemplo de `core/mocks`, sem precisar do backend. As consultas e o login funcionam; as alterações (criar torneio, lançar resultado…) respondem com erro 503 pedindo a API. `false`: os services chamam o [TCGBackend](../TCGBackend). |
| `apiUrl` | Endereço do backend. Em desenvolvimento: `http://localhost:8080` (`./mvnw spring-boot:run` na pasta do backend). |
| `tiposDeContaPermitidos` | Tipos de conta que entram no painel (`LOJA` e `ADMIN`). Uma conta `JOGADOR` recebe a mensagem de que o painel é das lojas. |

O backend já aceita chamadas de `http://localhost:*` (CORS em `app.cors.origens`, variável `CORS_ORIGENS`). Ao publicar o painel em outro endereço, inclua esse endereço ali.

Os componentes não sabem de onde vêm os dados: os services fazem as mesmas chamadas HTTP nos dois modos, e o `mockApiInterceptor` responde no lugar da API quando `usarMockApi` é `true`. O mock devolve o JSON no mesmo formato do backend.

### Contas de exemplo

As mesmas do `data.sql` do backend:

| Conta | Email | Senha |
|---|---|---|
| Loja (Card House, id 1) | `contato@cardhouse.com.br` | `123456` |
| Administrador | `admin@tcg.com` | `admin123` |
| Jogador (não entra no painel) | `eric@email.com` | `123456` |

## Estrutura

```
src/app/
├── core/                    camada de integração com o backend
│   ├── configuracao.ts        mock ou API, endereço da API, urlApi() e urlImagem()
│   ├── models/api.ts          formato exato do JSON do backend (requests e responses)
│   ├── models/sessao.ts       conta logada guardada no navegador
│   ├── services/              uma classe por recurso: auth, sessao, torneio, inscricao, partida,
│   │                          resultado, loja, evento, catalogo (jogos, formatos, endereços,
│   │                          jogadores), notificacao
│   ├── http/                  interceptors (token JWT, 401 -> login, mock) e parametros()
│   ├── mocks/                 dados de exemplo e as rotas simuladas
│   ├── erros.ts               mensagemDeErro(): texto do campo "detail" do backend
│   ├── regras.ts              transições de status do torneio e vagas permitidas (iguais às do backend)
│   ├── rotulos.ts             textos em português dos status e tipos
│   ├── jogos.ts               logo de cada jogo
│   └── autenticado.guard.ts   protege as páginas do painel
├── header/, footer/         layout
└── home/, jogos/, preco/, quemsomos/, torneios/, login/, cadastro/   páginas
```

As páginas do painel (depois do login) devem ficar em `painel/...` com `canActivate: [autenticadoGuard]`. O `app.routes.server.ts` já renderiza `painel/**` só no navegador, porque a sessão fica no `localStorage`.

### Exemplo de uso num componente

```ts
private torneios = inject(TorneioService);
private sessao = inject(SessaoService);

lista = toSignal(
  this.torneios.listar({ lojaId: this.sessao.conta()!.id, status: ['INSCRICOES_ABERTAS'] }),
);
```

Numa conta `LOJA`, o id da conta é o id da loja (`/lojas/{id}`). Para mostrar um erro ao usuário, use `mensagemDeErro(erro, 'Não foi possível salvar')`.
