# Prompt Melhorado: Cadastro de Ativos (Versão Next.js)

Copie o texto abaixo e utilize na sua ferramenta de IA favorita para obter os melhores resultados possíveis.

---

**Atue como um Desenvolvedor Full Stack Sênior especializado em Next.js, React, TypeScript e ecossistema Node.js.** 

Nós possuímos um sistema que gerencia ativos financeiros. Os dados da aplicação são persistidos atualmente em dois locais sincronizados: um arquivo `data.json` e uma planilha Excel, seguindo um modelo/padrão de arquitetura já previamente implementado.

**Objetivo:**
Desenvolver uma nova funcionalidade (Front-end e Back-end integrados) para permitir o cadastro de um novo ativo financeiro no sistema.

**Requisitos da Interface de Usuário (Front-end):**
1. **Navegação:** Adicionar uma nova opção no menu localizada no canto superior esquerdo da tela com o texto "Cadastrar Ativo".
2. **Formulário de Cadastro:** Criar um formulário contendo os seguintes campos:
   - **Tipo:** Campo obrigatório. Deve ser um *Select Box* (dropdown) carregando dinamicamente as opções de "Tipos" que já existem cadastradas no sistema.
   - **Categoria:** Campo obrigatório. Deve ser um *Select Box* carregando dinamicamente as opções de "Categorias" já existentes (ex: etfs, acoes, fundos).
   - **Papel:** Campo obrigatório. Campo de texto (input text) para inserir o código de negociação do ativo (ex: QQQI11, PETR4).
   - **Relatórios:** Campo obrigatório. (Input de texto ou área para anexos/links referentes aos relatórios do ativo).
   - **Link:** Campo de texto definido como *somente leitura* (`readonly`). O usuário não deve conseguir editar este campo manualmente.

**Requisitos de Lógica e Regras de Negócio:**
1. **Geração Automática do Link:** O campo "Link" deve ser montado e exibido automaticamente em tempo real no front-end concatenando a URL base da Status Invest com os valores selecionados em `Categoria` e preenchidos em `Papel`.
   - *Padrão da URL:* `https://statusinvest.com.br/{categoria}/{papel}`
   - *Exemplo:* Se a Categoria for `etfs` e o Papel for `qqqi11`, o link gerado será obrigatoriamente `https://statusinvest.com.br/etfs/qqqi11`.
   - *Tratamento:* Garanta que os valores interpolados na URL estejam em letras minúsculas e sem espaços, formando uma URL válida.
2. **Persistência de Dados (Route Handlers / Server Actions):** Ao submeter o formulário, a API do Next.js deve receber o payload e salvar o novo ativo obrigatoriamente nas duas fontes de dados:
   - No arquivo `data.json`.
   - No arquivo Excel (.xlsx).
   - *Nota Arquitetural:* A escrita nos arquivos deve aproveitar funções utilitárias/serviços e o modelo de dados que já estão implementados no projeto para leitura e escrita, mantendo o padrão existente.

**Saída Esperada:**
Por favor, forneça:
1. O código Front-end (ex: um componente React) com a lógica de montagem dinâmica do Link utilizando Hooks (`useState`, `useEffect`).
2. O código do Back-end no Next.js (ex: um Route Handler em `app/api/...` ou Server Action) demonstrando como receber a requisição e invocar as rotinas de salvamento no JSON e no Excel.
3. Breves instruções explicativas sobre como integrar essa nova funcionalidade na estrutura do Next.js já existente.
