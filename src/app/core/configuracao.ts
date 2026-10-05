import { TipoConta } from './models/api';

export const configuracao = {
  // true (padrão): o painel responde com os dados de exemplo de core/mocks (os mesmos do data.sql do
  // backend), sem chamar a API. Só as consultas e o login funcionam; as alterações pedem a API.
  // false: os services chamam o TCGBackend em apiUrl.
  usarMockApi: true,

  // Endereço do TCGBackend. Em desenvolvimento: ./mvnw spring-boot:run (perfil H2, porta 8080).
  apiUrl: 'http://localhost:8080',

  // O painel web é das lojas e do administrador. Jogadores usam o app mobile.
  tiposDeContaPermitidos: ['LOJA', 'ADMIN'] as TipoConta[],
};

// Monta a URL completa de uma rota da API ("/torneios" -> "http://localhost:8080/torneios")
export function urlApi(caminho: string): string {
  return configuracao.apiUrl.replace(/\/$/, '') + caminho;
}

// Imagens enviadas ficam na API como caminho relativo ("/uploads/..."); URLs completas passam direto
export function urlImagem(caminho: string | null | undefined): string | undefined {
  if (!caminho) return undefined;
  return caminho.startsWith('/uploads/') ? urlApi(caminho) : caminho;
}
