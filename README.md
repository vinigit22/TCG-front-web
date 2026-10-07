# TopDeck — Front-end web

Aplicação web do TopDeck, construída em Angular 21. Reúne três áreas:

| Área | Rotas | Acesso | Finalidade |
|---|---|---|---|
| Site | `/home`, `/jogos`, `/torneios`, `/preco`, `/quem-somos`, `/login`, `/cadastro` | Público | Apresentar a plataforma e cadastrar lojas |
| Painel da loja | `/painel` | Conta `LOJA` | Criar e conduzir torneios e eventos, gerenciar equipe e perfil |
| Admin geral | `/admin` | Conta `ADMIN` | Administrar contas, lojas, catálogo e a saúde da plataforma |

Jogadores usam o app mobile (`TCG-front-mobile`). O que a loja faz no painel chega ao app pelo backend (`TCGBackend`).

## Como executar

```bash
npm ci
npm start        # http://localhost:4200
npm test         # testes unitários (Vitest)
npm run build    # build de produção em dist/
```

### Contas de teste

Na tela `/login`, o modo demonstração oferece atalhos para estas contas (as mesmas do `data.sql` do backend):

| Perfil | Email | Senha | Destino |
|---|---|---|---|
| Loja (Card House) | `contato@cardhouse.com.br` | `123456` | `/painel` |
| Administrador | `admin@tcg.com` | `admin123` | `/admin` |
| Jogador | `eric@email.com` | `123456` | Acesso recusado (jogadores usam o app) |

## Modo demonstração e integração com a API

A origem dos dados é definida em `src/app/core/configuracao.ts`:

| Campo | Descrição |
|---|---|
| `usarMockApi` | `true` (padrão): as telas usam dados de exemplo, sem backend. Leituras e login funcionam; operações de gravação retornam erro 503 indicando que é necessária a API. `false`: as chamadas vão para o TCGBackend. |
| `apiUrl` | Endereço do backend (`http://localhost:8080` em desenvolvimento). |
| `tiposDeContaPermitidos` | Tipos de conta aceitos no sistema web (`LOJA` e `ADMIN`). |

Os services fazem as mesmas chamadas HTTP nos dois modos; no modo demonstração, um interceptor responde no lugar da API com o mesmo formato de JSON. Os painéis exibem a etiqueta "Modo demonstração" enquanto o mock está ativo.

O backend já aceita requisições de `http://localhost:*` (CORS). Para publicar em outro domínio, inclua o endereço em `CORS_ORIGENS` no backend.

## O que foi desenvolvido

### Painel da loja (`/painel`)

- **Visão geral:** indicadores (torneios ativos, inscritos, vagas, eventos), próximos torneios e lista de pendências com o próximo passo de cada torneio.
- **Torneios:** listagem por fase com busca e filtro por jogo; formulário de criação e edição com prévia de como o torneio aparece no app.
- **Detalhe do torneio:**
  - linha do tempo das fases e ações de status permitidas pelo backend;
  - aba Inscrições: check-in, situação do pagamento, ausência, cancelamento e inscrição manual por nickname;
  - aba Chave: geração da chave (com checklist de requisitos) e desenho da chave eliminatória, com lançamento de placar, W.O., desempate e correção de resultado;
  - **regra de pagamento:** a plataforma não processa pagamentos. O jogador paga na loja e a equipe marca a inscrição como paga; só faz check-in e entra na chave quem está com pagamento **Pago** ou **Isento** (torneios gratuitos já nascem isentos). Ao fazer o check-in de um jogador pendente, o painel pede a confirmação do recebimento e grava pagamento e check-in juntos. A mesma regra é aplicada no backend;
  - aba Resultados: pódio e registro do prêmio entregue.
- **Eventos:** criação, edição, mudança de status e lista de presenças confirmadas.
- **Equipe:** inclusão de membros por nickname, troca de papel (proprietário, organizador, juiz) e desativação.
- **Perfil da loja:** dados, imagens, endereço e situação da verificação, com prévia.
- **Notificações** e **Segurança** (troca de senha).

### Admin geral (`/admin`)

- **Visão geral:** indicadores da plataforma, gráfico de contas por tipo e de torneios por fase, lojas aguardando verificação e contas recentes.
- **Contas:** filtro por tipo e situação, ativação/desativação e exclusão (a própria conta é protegida).
- **Lojas:** concessão e remoção do selo de loja verificada.
- **Jogadores:** perfis com quadro de medalhas calculado a partir dos resultados.
- **Administradores:** criação, renomeação e remoção.
- **Torneios:** visão de todos os torneios, consulta da chave, cancelamento e exclusão.
- **Catálogo:** cadastro de jogos e formatos, com ativação e desativação.
- **Avisos:** envio de comunicados para lojas, jogadores, todas as contas ou uma conta específica.
- **Sistema:** verificação de disponibilidade e tempo de resposta de cada área da API e dados da sessão.
- **Planos e assinaturas:** tela em prévia (ver pendências).

### Site público

- Nova identidade visual (roxo e verde-menta) aplicada a todas as páginas, preservando os textos e o logo originais.
- Cabeçalho responsivo com menu para celular e acesso direto ao painel quando o usuário já está logado.
- Login integrado ao `AuthService`, com redirecionamento por tipo de conta.
- Cadastro de loja com as mesmas validações do backend.
- Página de planos alimentada pela mesma lista usada no admin (`compartilhado/planos.ts`).

### Base técnica

- **Design system** em `src/styles.css`: paleta, tipografia (Plus Jakarta Sans e Bungee), botões, formulários, cartões, tabelas, selos, abas, modais e indicadores. Gráficos com paleta validada para daltonismo.
- **Componentes reutilizáveis** em `src/app/ui/`: layout dos painéis, ícones, modal, confirmação, avisos, menu de ações, estado vazio, desenho da chave, gráficos, campos de endereço e busca de jogador.
- **Camada de integração** em `src/app/core/`: tipos do JSON da API, um service por recurso, sessão, interceptors (token JWT, sessão expirada, mock) e guard por tipo de conta (`tipoContaGuard`).
- Painéis carregados sob demanda e renderizados apenas no navegador; páginas públicas pré-renderizadas no build.

## Estrutura

```
src/
├── styles.css             design system
└── app/
    ├── core/              integração com o backend (models, services, http, mocks, regras, guards)
    ├── ui/                componentes reutilizáveis e layout dos painéis (shell/)
    ├── painel/            painel da loja
    ├── admin/             admin geral
    ├── seguranca/         troca de senha (loja e admin)
    ├── compartilhado/     dados usados pelo site e pelo admin (planos)
    ├── layout-publico/    cabeçalho e rodapé do site
    └── home/, jogos/, preco/, quemsomos/, torneios/, login/, cadastro/
```

### Padrão de tela

```ts
export class MinhaTela {
  private readonly torneios = inject(TorneioService);
  private readonly lojaId = idDaLojaLogada();

  // dados(), carregando(), erro() e recarregar(); recarrega sozinho se um signal usado na consulta mudar
  protected readonly lista = recurso(() => this.torneios.listar({ lojaId: this.lojaId }));
}
```

Para retorno ao usuário, use `Avisos` (mensagens de sucesso e erro), `Confirmacao` (antes de ações destrutivas) e `mensagemDeErro()` (texto do campo `detail` retornado pelo backend).

## Validação

- Build de produção e testes unitários (inclusive guards, login por tipo de conta, telas dos painéis e desenho da chave) executados com sucesso.
- As operações de gravação dos dois painéis foram validadas contra o TCGBackend real: ciclo completo de um torneio (inscrições, check-in, chave com bye, desempate, correção e final com pódio), eventos, equipe, perfil e todas as funções do admin.
- O mock foi conferido contra a API: as respostas simuladas têm o mesmo formato das reais.

## Pendências que dependem do backend

- **Planos e assinaturas:** o backend ainda não possui esse módulo. A tela usa dados de exemplo e apresenta o modelo de tabelas e rotas sugerido.
- **Avisos em massa:** a API cria uma notificação por conta; o admin envia uma requisição por destinatário.
- **Imagens de loja, torneio e evento:** aceitas apenas por URL; o upload de arquivo existe somente para a foto do jogador.
- **Equipe da loja:** membros com conta de jogador ainda não acessam o painel; falta no backend uma rota que liste as lojas de um membro.
