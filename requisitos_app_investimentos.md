# Documento de Requisitos e Plano de Implementação

## 1. Visão Geral
O sistema é uma aplicação web local, sem necessidade de autenticação, desenvolvida para consultar cotações e relatórios de ativos financeiros (ETFs, FIIs, Fiagros). A aplicação utiliza uma planilha Excel como fonte inicial de ativos, armazena o estado em um arquivo JSON local e extrai dados (web scraping) do site StatusInvest para manter as cotações e relatórios atualizados.

## 2. Stack Tecnológico
*   **Framework:** Next.js (React)
*   **Arquitetura:** Separação estrutural em duas pastas principais: `frontend` (componentes, páginas) e `backend` (API routes, serviços lógicos).
*   **Estilização:** Bootstrap (utilizando classes como `table table-striped-columns`).
*   **Banco de Dados:** Arquivo local `data.json`.
*   **Leitura de Excel:** Biblioteca `xlsx` ou similar.
*   **Web Scraping & Download:** `puppeteer` (ou `cheerio` + `axios` com headers configurados) para lidar com as marcações HTML dinâmicas do StatusInvest.

---

## 3. Requisitos Funcionais (RF)

*   **RF01 - Carga Inicial via Excel:** Na primeira execução, se o banco de dados não existir, o sistema deve ler a planilha `fundos-para-analise.xlsx` carregando as colunas: Tipo, Papel, Categoria, Link, Valor Atual, Minima 52 Semanas, Maxima 52 Semanas, Relatorios, Data Ultimo Relatorio, Link Relatorio.
*   **RF02 - Persistência em JSON:** Os dados extraídos do Excel devem ser gravados em um arquivo local `.json`. Em execuções subsequentes, o sistema deve priorizar o carregamento a partir do arquivo JSON.
*   **RF03 - Interface de Tabela:** A tela inicial deve exibir os ativos em uma tabela estilizada com Bootstrap. A coluna "Papel" deve ser um hiperlink para a URL correspondente (coluna "Link").
*   **RF04 - Botão "Atualizar Dados":** Deve reler o arquivo Excel base para adicionar ou atualizar os ativos no arquivo JSON.
*   **RF05 - Botão "Atualizar Cotação":** Deve buscar no StatusInvest, de forma assíncrona e processando uma linha por vez, os campos "Valor atual", "Min. 52 semanas" e "Máx. 52 semanas", atualizando o JSON e a planilha Excel.
*   **RF06 - Botão "Atualizar Relatórios":** Para ativos marcados com "Relatorios = Sim", deve buscar assincronamente (uma linha por vez) o relatório mais recente (Data e Link) no StatusInvest, atualizando JSON e Excel.
*   **RF07 - Seleção de Relatórios:** A tabela deve possuir uma coluna de Checkbox (apenas nas linhas com relatórios disponíveis) para selecionar itens para download, além de um Checkbox no cabeçalho para "Marcar/Desmarcar Todos".
*   **RF08 - Botão "Baixar Relatórios":** Deve realizar o download sequencial (assíncrono) dos relatórios marcados. O sistema deve exibir um ícone de carregamento (loading) apenas na linha em processamento.
*   **RF09 - Armazenamento de Arquivos:** Os relatórios baixados devem ser salvos na pasta `/relatorios` no formato `papel-yyyy-mm-dd.*`. O sistema deve verificar se o arquivo já existe para evitar re-download e sinalizar no JSON que o último relatório já está baixado.

---

## 4. Requisitos Não Funcionais (RNF)
*   **RNF01:** A aplicação não exigirá sistema de login/autenticação.
*   **RNF02:** A interface deve ser responsiva e utilizar classes nativas do Bootstrap.
*   **RNF03:** O scraping deve possuir mecanismos (como delay entre requisições ou simulação de navegador) para contornar bloqueios do StatusInvest, já que as requisições serão feitas sequencialmente (uma por vez).

---

## 5. Lista de Tarefas e Prompts para Implementação

Abaixo está o backlog estruturado. Para codificar a aplicação, basta enviar os prompts abaixo em sequência para a sua IA geradora de código.

### Tarefa 1: Setup do Projeto e Estrutura Inicial
**Objetivo:** Criar o projeto Next.js, configurar o Bootstrap e definir a estrutura de pastas `frontend` e `backend`.

**Prompt:**
```text
Crie a estrutura de um projeto Next.js (App Router) considerando as seguintes restrições arquiteturais:
1. Instale o Bootstrap e o configure no layout principal.
2. Organize o projeto com uma pasta clara para o `frontend` (componentes, telas) e uma para o `backend` (serviços de leitura de arquivos e API routes).
3. Instale as dependências necessárias: `xlsx` (para manipular Excel), `puppeteer` (ou `cheerio` para scraping) e `axios`.
Escreva o código de configuração inicial, as mudanças no `layout.tsx` para carregar o CSS do Bootstrap e a estrutura sugerida de diretórios.
```

### Tarefa 2: Módulo de Leitura de Excel e Persistência JSON
**Objetivo:** Implementar o backend que lê `fundos-para-analise.xlsx`, converte para JSON e cria a lógica de persistência.

**Prompt:**
```text
Atuando como desenvolvedor backend em Node/Next.js, crie um serviço (dentro da pasta backend configurada) que gerencie os dados dos ativos financeiros:
1. Crie uma função que verifica se o arquivo `data.json` existe na raiz do projeto. Se existir, retorne seus dados.
2. Se não existir, a função deve ler a planilha `fundos-para-analise.xlsx` (usando a lib `xlsx`), extrair as colunas: Tipo, Papel, Categoria, Link, Valor Atual, Minima 52 Semanas, Maxima 52 Semanas, Relatorios, Data Ultimo Relatorio, Link Relatorio, e salvar no `data.json`.
3. Crie uma rota de API (ex: `/api/assets`) que o frontend chamará para resgatar esses dados.
4. Crie uma rota `/api/sync-excel` que força a releitura do Excel e faz o merge com os dados atuais do JSON.
Forneça o código dos serviços e das rotas de API.
```

### Tarefa 3: Interface Principal (Tabela Bootstrap)
**Objetivo:** Renderizar os dados na tela inicial.

**Prompt:**
```text
Atuando como desenvolvedor frontend, crie a tela inicial (`page.tsx`) do nosso app Next.js consumindo a API `/api/assets` criada anteriormente.
1. Renderize os dados em uma tabela HTML utilizando a classe `<table class="table table-striped-columns">` do Bootstrap.
2. A coluna "Papel" deve conter uma tag `<a>` com o link apontando para a URL da coluna "Link".
3. Adicione uma nova coluna na tabela com checkboxes. O cabeçalho deve ter um checkbox que seleciona/deseleciona todas as linhas, mas os checkboxes das linhas só devem ser renderizados se a coluna "Relatorios" for igual a "Sim" e possuir uma "Data Ultimo Relatorio".
4. Adicione os botões superiores: "Atualizar Dados", "Atualizar Cotação", "Atualizar Relatórios" e "Baixar Relatórios".
Forneça o código completo do componente e a lógica de state (useState, useEffect) para gerenciar a seleção dos checkboxes.
```

### Tarefa 4: Web Scraping de Cotações
**Objetivo:** Construir o crawler para o StatusInvest e a rota de atualização.

**Prompt:**
```text
Crie uma rota de API Next.js `/api/scrape-quote` que recebe o 'Papel' e o 'Link' do StatusInvest.
A função de scraping deve acessar a página e extrair os seguintes valores, baseados nestas estruturas HTML conhecidas:
- Valor Atual: `<div title="Valor atual do ativo"> ... <strong class="value">8,16</strong></div>`
- Min. 52 semanas: `<div title="Valor mínimo das últimas 52 semanas"> ... <strong class="value">7,44</strong></div>`
- Máx. 52 semanas: `<div title="Valor máximo das últimas 52 semanas"> ... <strong class="value">9,24</strong></div>`

A rota deve atualizar esses valores no `data.json` e no arquivo `fundos-para-analise.xlsx`.
No Frontend, implemente a ação do botão "Atualizar Cotação": ele deve fazer um loop na lista de ativos, disparar uma chamada assíncrona para `/api/scrape-quote` para uma linha por vez (aguardando o término de uma para iniciar a outra) e atualizar a tabela na tela em tempo real.
```

### Tarefa 5: Web Scraping de Relatórios
**Objetivo:** Obter o link e data do último relatório no StatusInvest.

**Prompt:**
```text
Crie uma rota de API Next.js `/api/scrape-report` que acessa o link de um ativo no StatusInvest que possua 'Relatorios' == 'Sim'.
A lógica precisa:
1. Simular o clique/filtro na combobox de Categorias selecionando "Relatórios" (value="6"). A estrutura do campo é um select estilizado: `<select data-formselect="" name="DocumentsFiiCategories"> <option value="6">Relatórios</option> </select>`.
2. Acessar a div `<div class="documents card">` e ler a propriedade JSON contida em `data-page="[{...}]"`.
3. Fazer o parse desse JSON extraído do atributo `data-page`, pegar o item mais recente onde a descrição contém "Relatório Gerencial" ou "Relatórios", e extrair as chaves `dataEntrega` e `link`.
4. Atualizar o `data.json` e o Excel com a "Data Ultimo Relatorio" e o "Link Relatorio".
No frontend, amarre essa rota ao botão "Atualizar Relatórios" executando assincronamente uma linha por vez.
```

### Tarefa 6: Download de Relatórios e Feedback Visual
**Objetivo:** Rotina para baixar os PDFs fisicamente e gerenciar o estado de UI.

**Prompt:**
```text
Precisamos implementar a lógica do botão "Baixar Relatórios".
No backend, crie uma rota `/api/download-report` que recebe o 'Papel', 'Data Ultimo Relatorio' e o 'Link Relatorio'.
1. A rota deve extrair o PDF/arquivo do link fornecido.
2. Salve o arquivo localmente no servidor dentro de uma pasta `relatorios/`, nomeando como `[Papel]-[yyyy-mm-dd].[ext]`.
3. Antes de baixar, verifique se o arquivo já existe na pasta. Se existir, pule o download. Marque no `data.json` um flag indicando que este relatório foi baixado.

No frontend:
1. Ao clicar em "Baixar Relatórios", pegue todos os papéis cujos checkboxes estão marcados.
2. Faça um loop assíncrono (um por vez) chamando a rota `/api/download-report`.
3. Adicione um estado na tabela que exibe um ícone de "loading" (spinner do Bootstrap) na respectiva linha enquanto ela está sendo processada, sumindo quando o download finalizar.
Forneça os códigos da API e as atualizações de estado do componente frontend.
```
