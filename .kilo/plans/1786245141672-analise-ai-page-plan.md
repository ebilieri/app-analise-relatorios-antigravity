# Plano: Página de Análise com IA

## Descobertas

- **App Router Next.js:** projeto usa App Router (`src/app/`). Páginas existentes são Client Components (`'use client'`).
- **Relatórios locais:** já existe rota API em `src/app/relatorios/[filename]/route.ts` para servir PDFs de `relatorios/`.
- **Estrutura de dados:** `caminhoRelatorioLocal` armazena caminho relativo como `/relatorios/XXXX.pdf`.
- **Prompt:** `prompt-analista.md` na raiz, com placeholders `[INSIRA O NOME OU TICKER DO ATIVO AQUI]` e `[Link do pdf no repositorio local]`.

## Decisões

- **Rota:** `/analise/[papel]` (Client Component).
- **API:** `GET /api/analise/[papel]` lê o prompt do disco, busca o ativo, substitui placeholders e retorna o texto final.
- **Botão na tabela:** aparece apenas quando `baixado === true && caminhoRelatorioLocal` existe, ao lado do botão "Baixado".
- **Navegação:** usa `<a>` simples para `/analise/${asset.Papel}` (consistente com links existentes na tabela).
- **Placeholders:**
  - `[INSIRA O NOME OU TICKER DO ATIVO AQUI]` → `asset.Papel`
  - `[Link do pdf no repositorio local]` → `asset.caminhoRelatorioLocal`

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/app/api/analise/[papel]/route.ts` | Novo — GET retorna prompt preenchido |
| `src/app/analise/[papel]/page.tsx` | Novo — página com textarea e botão voltar |
| `src/frontend/components/AssetTable.tsx` | Modificar — adicionar botão "Analise" condicional |

## Passos

### 1. API Route `src/app/api/analise/[papel]/route.ts`
- Ler `prompt-analista.md` da raiz com `fs.readFileSync`.
- Buscar asset via `getAssets()` e filtrar por `Papel.toUpperCase()`.
- Substituir placeholders no texto.
- Retornar `{ success: true, data: { prompt, papel } }` ou 404/500.

### 2. Página `src/app/analise/[papel]/page.tsx`
- Client Component (`'use client'`).
- Usar `useParams` para obter `papel`.
- `useEffect` para buscar `GET /api/analise/${papel}`.
- Renderizar textarea readonly com o prompt, botão "Voltar" e título com o ticker.

### 3. Botão em `AssetTable.tsx`
- Dentro da célula de ações, após o bloco `baixado && caminhoRelatorioLocal`, adicionar botão `<a href={`/analise/${asset.Papel}`}>` com estilo `btn-outline-primary` e ícone `bi-robot` ou `bi-brain`.

## Validação

- `npx tsc --noEmit`
- Cadastrar/baixar CPTR11 → botão "Analise" aparece
- Clicar em "Analise" → página carrega prompt com ticker e link preenchidos
- Acessar `/analise/CPTR11` diretamente → funciona

## Riscos

- Se o prompt for editado manualmente, placeholders podem mudar; manter replacement exato por enquanto.
- `caminhoRelatorioLocal` pode ser `null`; botão não aparece nesse caso.
