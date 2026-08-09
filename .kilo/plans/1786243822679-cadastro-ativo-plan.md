# Plano: Cadastro de Ativos

## Decisões Tomadas

- **Stack:** Next.js/TypeScript (reutiliza stack existente, descarta referência a C# do documento original).
- **Navegação:** Toggle na mesma página (`page.tsx`) via estado `showForm`. O `ControlPanel` recebe botão "Cadastrar Ativo".
- **Campo Relatórios:** Mantido como **select `"Sim" | "Não"`** para preservar compatibilidade com `data.json` e `fundos-para-analise.xlsx`. O documento pede texto/links, mas o schema existente usa esse campo como flag e alterá-lo quebraria sincronização e dados atuais.
- **Link:** Campo `readonly` gerado no frontend em tempo real via `https://statusinvest.com.br/{categoria}/{papel}` (minúsculo, sem espaços).

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/backend/types.ts` | Adicionar nota/documentação se necessário (schema permanece) |
| `src/backend/services/dataService.ts` | Adicionar função `addAsset()` |
| `src/app/api/assets/route.ts` | Adicionar método `POST` |
| `src/frontend/components/ControlPanel.tsx` | Adicionar botão "Cadastrar Ativo" e prop `onShowForm` |
| `src/frontend/components/AssetForm.tsx` | **Novo componente** — formulário de cadastro |
| `src/app/page.tsx` | Gerenciar estado `showForm` e renderizar condicional |

## Passos de Implementação

### 1. Backend — `dataService.ts`
- Criar `addAsset(asset: Asset): Asset`
  - Normalizar entrada (trim, uppercase no Papel)
  - Validar duplicidade por `Papel` (case-insensitive)
  - Anexar à lista atual, ordenar por Tipo/Papel
  - Salvar em `data.json` e `Excel` usando `saveToJSON`/`saveToExcel`

### 2. Backend — API Route `/api/assets`
- Adicionar método `POST`
  - Validar payload (`Tipo`, `Categoria`, `Papel`, `Relatorios`)
  - Montar `Link` no backend também (validação defensiva)
  - Chamar `addAsset`
  - Retornar `{ success: true, data: asset }` ou erro 400/500

### 3. Frontend — `ControlPanel.tsx`
- Adicionar botão "Cadastrar Ativo" (estilo `btn-outline-secondary` ou `btn-outline-dark`)
- Receber props: `showForm: boolean`, `onToggleForm: () => void`
- Desabilitar botões de ação quando `showForm === true`

### 4. Frontend — `AssetForm.tsx` (novo)
- Campos: `Tipo` (select dinâmico), `Categoria` (select dinâmico), `Papel` (text), `Relatorios` (select `Sim`/`Não`), `Link` (readonly)
- `useEffect` para gerar `Link` automaticamente quando `Categoria` ou `Papel` mudarem
- Listas de opções extraídas de `assets` existentes (valores únicos de `Tipo` e `Categoria`)
- Submissão via `axios.post('/api/assets', payload)`
- Feedback: toast de sucesso/erro, loading state, reset de formulário

### 5. Frontend — `page.tsx`
- Adicionar estado: `showForm: boolean`
- Passar `onToggleForm` para `ControlPanel`
- Renderizar `<AssetForm />` quando `showForm === true`, senão `<AssetTable />`

## Validação

- `npm run lint` e `npm run typecheck`
- Testar cadastro de ativo novo (sem duplicidade)
- Testar duplicidade (mesmo Papel) → erro
- Verificar escrita em `data.json` e `fundos-para-analise.xlsx`
- Confirmar que `Link` gerado respeita minúsculas/sem espaços

## Riscos

- Alterar schema do `Asset` não é necessário, mas se futuro requisito exigir armazenar texto de relatórios, será necessário novo campo (ex: `RelatoriosLinks`) para não quebrar compatibilidade.
- Navegação por toggle pode poluir a página se o formulário for grande; considerar scroll automático para o formulário ao abrir.
