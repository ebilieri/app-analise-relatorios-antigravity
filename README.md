# 📊 Sistema de Análise de Investimentos (ETFs, FIIs, Fiagros)

Aplicação web local desenvolvida em **Next.js (App Router)** com **Bootstrap 5** para consulta de cotações, monitoramento de relatórios gerenciais e download automatizado de PDFs do site **StatusInvest** e **B3**.

---

## 🌟 Funcionalidades Principais

* **📁 Carga Inicial & Persistência Bidirecional:**
  * Carga inicial dos ativos a partir da planilha `fundos-para-analise.xlsx`.
  * Persistência do estado em `data.json`.
  * Ordenação automática dos ativos por **Tipo (A-Z)** e secundariamente por **Papel (A-Z)** em ambos os arquivos (`data.json` e Excel).
  * Botão **"Atualizar Dados"** para forçar a releitura do Excel e mesclar novos ativos.

* **🎨 Interface Visual Bootstrap:**
  * Tabela estilizada e responsiva com visualização moderna.
  * Links diretos para a página do ativo no StatusInvest na coluna **Papel**.
  * Badges com cores personalizadas para cada tipo de ativo:
    * `ETF`: `#c1e4f2` (Azul Claro)
    * `FIAGRO`: `#f5f5b4` (Amarelo Claro)
    * `INFRA`: `#b3def5` (Azul Celeste)
    * `PAPEL`: `#b3f5b5` (Verde Menta)
    * `VENDA`: `#f5b3d2` (Rosa Claro)
    * `TIJOLO`: `#bda7b1` (Lilás/Cinza)

* **🤖 Web Scraping de Cotações:**
  * Raspagem de cotações em tempo real (**Valor Atual**, **Mínima 52 Semanas**, **Máxima 52 Semanas**).
  * Processamento assíncrono **linha por linha** com atualização visual no grid em tempo real.
  * Estratégia resiliente de scraping via **Axios + Cheerio** com fallback automático para **Puppeteer (Headless Browser)**.

* **📑 Web Scraping de Relatórios Gerenciais:**
  * Raspagem automática da **Data do Último Relatório** e do **Link do PDF** no StatusInvest para os ativos marcados com `Relatorios = Sim`.

* **📥 Download Automatizado de PDFs:**
  * Download sequencial dos PDFs selecionados, salvando na pasta local `/relatorios` no padrão `[papel]-[yyyy-mm-dd].pdf`.
  * Botão **"Baixado"** transformado em um hyperlink verde clicável que abre o PDF salvo no servidor local diretamente em uma nova aba do navegador.
  * **Gerenciamento Inteligente de Checkboxes:** Checkboxes habilitados apenas para relatórios pendentes; desmarcação automática assim que o download é concluído.
  * **Detecção Física & Re-download:** Se o PDF for deletado da pasta local, o sistema detecta automaticamente a ausência e habilita o ativo para novo download.

---

## 🛠️ Stack Tecnológica

* **Framework Frontend / Backend:** Next.js 15 (App Router, React 19, TypeScript)
* **Estilização & Ícones:** Bootstrap 5.3 + Bootstrap Icons
* **Manipulação de Excel:** `xlsx` (SheetJS)
* **Web Scraping & Requisições:** `axios`, `cheerio`, `puppeteer`, `node:https`

---

## 📂 Estrutura do Projeto

```text
app-analise-rel-google/
├── fundos-para-analise.xlsx       # Planilha Excel inicial de ativos
├── data.json                      # Arquivo de persistência local (gerado automaticamente)
├── relatorios/                    # Pasta local onde os PDFs são salvos
├── public/                        # Ativos estáticos públicos
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout raiz com Bootstrap e suporte a suppressHydrationWarning
│   │   ├── page.tsx               # Página principal do Dashboard
│   │   ├── relatorios/[filename]/ route.ts  # Servidor estático dos PDFs baixados
│   │   └── api/
│   │       ├── assets/            # GET: Obtém a lista de ativos do JSON/Excel
│   │       ├── sync-excel/        # POST: Sincroniza dados da planilha Excel com o JSON
│   │       ├── scrape-quote/      # POST: Raspa cotações de 1 ativo no StatusInvest
│   │       ├── scrape-report/     # POST: Raspa data e link de relatório no StatusInvest
│   │       └── download-report/   # POST: Baixa o PDF do relatório para a pasta /relatorios
│   ├── backend/
│   │   ├── types.ts               # Interfaces TypeScript (Asset)
│   │   └── services/
│   │       ├── dataService.ts     # Leitura, gravação, validação e ordenação (Tipo, Papel)
│   │       ├── quoteScraper.ts    # Serviço de scraping de cotação
│   │       └── reportScraper.ts   # Serviço de scraping de relatórios
│   └── frontend/
│       └── components/
│           ├── ControlPanel.tsx   # Painel de botões superiores e barra de progresso
│           └── AssetTable.tsx     # Tabela de exibição dos ativos com seleção e badges
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

* **Node.js**: v18.0.0 ou superior (Recomendado: v20+ ou v24+)
* **npm**: v9.0.0 ou superior

---

### Passo a Passo

1. **Clonar ou acessar a pasta do projeto:**
   ```bash
   cd c:\Users\ebili\OneDrive\_Investimentos\app-analise-rel-google
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar no navegador:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📑 Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Compila o projeto Next.js para produção |
| `npm start` | Inicia o servidor Next.js em modo de produção |
| `npm run lint` | Executa a verificação de código via ESLint |

---

## 💡 Como Usar a Aplicação

1. **Visualizar Ativos:** Ao abrir a página, a tabela carregará os ativos lidos do `fundos-para-analise.xlsx` (ou do `data.json` se já existir), ordenados por **Tipo** e **Papel**.
2. **Atualizar Cotações:** Clique no botão **"Atualizar Cotação"**. O sistema irá consultar a cotação de cada ativo sequencialmente no StatusInvest e atualizar os valores na tela, no JSON e no Excel.
3. **Atualizar Relatórios:** Clique no botão **"Atualizar Relatórios"**. O sistema buscará a data e o link do relatório mais recente para cada ativo com `Relatorios = Sim`.
4. **Baixar Relatórios:** Marque os checkboxes dos relatórios pendentes desejados e clique no botão **"Baixar Relatórios"**. Os PDFs serão salvos na pasta `/relatorios` e o botão na tabela passará para o estado verde clicável **"Baixado"**.
5. **Abrir Relatório Baixado:** Clique no botão verde **"Baixado"** de qualquer ativo para abrir o arquivo PDF diretamente no navegador.
