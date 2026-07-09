# FinanceOS — Documentação Técnica e Funcional

> Sistema web de gestão financeira pessoal com foco em controle de dívidas, planejamento orçamentário e inteligência financeira.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Banco de Dados](#4-banco-de-dados)
5. [API — Rotas e Endpoints](#5-api--rotas-e-endpoints)
6. [Frontend — Telas e Componentes](#6-frontend--telas-e-componentes)
7. [Autenticação e Segurança](#7-autenticação-e-segurança)
8. [Funcionalidades Detalhadas](#8-funcionalidades-detalhadas)
9. [Estrutura de Diretórios](#9-estrutura-de-diretórios)
10. [Configuração e Execução](#10-configuração-e-execução)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Banco de Dados — Migrations](#12-banco-de-dados--migrations)

---

## 1. Visão Geral

**FinanceOS** é uma plataforma SaaS de gestão financeira pessoal projetada para auxiliar usuários no controle de dívidas, planejamento de pagamentos e análise da saúde financeira com recomendações inteligentes.

### Para que serve?

O sistema resolve um problema muito comum: a falta de visibilidade e controle sobre o conjunto de dívidas pessoais. Com o FinanceOS, o usuário consegue:

- **Mapear todas as suas dívidas** em um único lugar, com detalhes como parcelas, datas de vencimento, status e prioridade.
- **Acompanhar a evolução** dos pagamentos mês a mês.
- **Planejar a quitação** usando as estratégias Snowball (menor dívida primeiro) ou Avalanche (maior juros primeiro).
- **Receber alertas inteligentes** com base no perfil financeiro, como endividamento crítico, dívidas em atraso e dívidas prestes a serem quitadas.
- **Exportar relatórios** em Excel para controle externo.
- **Manter histórico de auditoria** de todas as alterações realizadas no sistema.

### O que o sistema faz?

| Módulo | Descrição |
|---|---|
| **Autenticação** | Registro e login com JWT via Supabase Auth |
| **Gestão de Dívidas** | CRUD completo com status, categorias, prioridades e parcelas |
| **Dashboard** | Visão consolidada com gráficos de evolução e comprometimento de renda |
| **Planejamento** | Simulador de quitação com projeção de 12 meses |
| **Inteligência** | Score de risco financeiro e recomendações personalizadas |
| **Relatórios** | Exportação em Excel com múltiplas abas e histórico de pagamentos |
| **Arquivo** | Consulta de dívidas quitadas, removidas automaticamente da Gestão de Dívidas |
| **Auditoria** | Log imutável de todas as ações do usuário |

---

## 2. Arquitetura do Sistema

O FinanceOS segue uma arquitetura **Full-Stack SPA com API REST**, dividida em três camadas principais:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                     │
│                    React SPA (Vite / ES Modules)             │
│   Dashboard │ Dívidas │ Planejamento │ Inteligência │ Audit  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP /api (proxy em dev)
                           │ JWT Bearer Token
┌──────────────────────────▼──────────────────────────────────┐
│                     BACKEND (Node.js)                        │
│                     Express.js REST API                      │
│   /auth │ /debts │ /settings │ /audit │ /health             │
│         Middleware de Auth (JWT validation)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Supabase JS Client
                           │ Service Role Key
┌──────────────────────────▼──────────────────────────────────┐
│                     BANCO DE DADOS                           │
│                Supabase (PostgreSQL gerenciado)              │
│   debts │ user_settings │ audit_log │ auth.users (builtin)  │
│         Row Level Security (RLS) por user_id                 │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
1. Usuário faz login → Supabase Auth retorna JWT
2. JWT armazenado em localStorage (chave: fos-token)
3. Todas as requisições incluem: Authorization: Bearer <token>
4. Backend valida o JWT com Supabase antes de processar
5. Queries ao banco sempre filtradas por user_id (RLS)
6. Respostas retornam JSON para o React atualizar a UI
```

### Padrões Arquiteturais

- **Monorepo**: frontend e backend no mesmo repositório, pastas separadas.
- **Proxy Dev**: Vite redireciona `/api` para `localhost:3001` em desenvolvimento.
- **Service Role**: Backend usa a chave de serviço do Supabase para controle total, com segurança garantida pelo JWT.
- **RLS (Row-Level Security)**: Políticas no banco garantem que usuários acessem somente seus próprios dados.
- **Audit Trail**: Toda criação, edição e exclusão gera um registro imutável em `audit_log`.

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Papel |
|---|---|---|
| **Node.js** | 18+ | Runtime JavaScript server-side |
| **Express.js** | 4.19.2 | Framework HTTP / Roteamento |
| **Supabase JS** | 2.45.0 | Client para PostgreSQL e Auth |
| **CORS** | 2.8.5 | Controle de origens permitidas |
| **dotenv** | 16.4.5 | Gerenciamento de variáveis de ambiente |

### Frontend

| Tecnologia | Versão | Papel |
|---|---|---|
| **React** | 18.3.1 | Framework de UI / SPA |
| **Vite** | 5.4.1 | Build tool e dev server |
| **Recharts** | 2.12.7 | Gráficos e visualizações de dados |
| **write-excel-file** | 4.0.7 | Geração de arquivos Excel no browser |

### Banco de Dados / Infraestrutura

| Tecnologia | Papel |
|---|---|
| **Supabase** | BaaS — PostgreSQL gerenciado, Auth, RLS |
| **PostgreSQL** | Banco de dados relacional (via Supabase) |
| **UUID** | Extensão para chaves primárias universais |

### Estilização

- CSS puro em linha (inline styles) — sem frameworks CSS externos.
- Sistema de temas `TH.dark` / `TH.light` definido em `constants.js`.
- Media queries para responsividade mobile, injetadas via `<style>` global em `App.jsx`.
- Classes utilitárias reutilizáveis para colapsar layouts em telas pequenas (aplicadas nos componentes de tela, combinadas com inline styles):
  - `grid-stat` — grids de N colunas (cards de estatística) → 2 colunas em ≤768px, 1 coluna em ≤480px.
  - `grid-2col` — grids de 2 colunas → 1 coluna em ≤768px.
  - `row-card-grid` — cards em grid `1fr auto` (linha de dívida + ações) → empilha em coluna única em ≤768px.
  - `debt-actions` — bloco de botões de ação → vira `flex-row` com wrap em ≤768px.
  - `filter-bar` — barra de filtros → scroll horizontal em ≤768px.
  - `extrato-table` — tabela de extrato (Relatórios) → ganha `min-width` em ≤768px e rola horizontalmente dentro de um contêiner com `overflow-x:auto`.

---

## 4. Banco de Dados

### Modelo de Dados

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   auth.users    │     │     debts         │     │   audit_log     │
│─────────────────│     │──────────────────│     │─────────────────│
│ id (uuid) PK    │──┐  │ id (uuid) PK     │  ┌──│ id (uuid) PK    │
│ email           │  └─►│ user_id (uuid) FK│  │  │ user_id (uuid)  │
│ created_at      │     │ creditor (text)   │  │  │ action (text)   │
└─────────────────┘  ┌─►│ cat (text)        │  │  │ entity (text)   │
                     │  │ for_ (text)       │  │  │ entity_id (uuid)│
┌─────────────────┐  │  │ monthly (numeric) │  │  │ description     │
│ user_settings   │  │  │ ti (integer)      │  │  │ old_value(jsonb)│
│─────────────────│  │  │ paid (integer)    │  │  │ new_value(jsonb)│
│ user_id (uuid)  │──┘  │ rem (integer)     │  │  │ created_at      │
│ salary (numeric)│     │ total (numeric)   │  │  └─────────────────┘
│ cash_balance    │     │ due (integer)     │  │
│ effective_date  │     │ status (text)     │──┘
│ updated_at      │     │ priority (text)   │
└─────────────────┘     │ note (text)       │
                     ┌─►│ created_at        │
┌─────────────────┐  │  └──────────────────┘
│ debt_payments   │  │
│─────────────────│  │
│ id (uuid) PK    │  │
│ user_id (uuid)  │  │
│ debt_id (uuid)  │──┘
│ installment_num │
│ amount (numeric)│
│ paid_at (tsz)   │
└─────────────────┘
```

### Tabela: `debts`

Armazena todas as dívidas dos usuários.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária (gerada automaticamente) |
| `user_id` | uuid | FK para `auth.users` — isolamento por usuário |
| `creditor` | text | Nome do credor (ex: "Itaú", "Nubank") |
| `cat` | text | Categoria (Moradia, Empréstimo, Saúde, Outros…) |
| `for_` | text | Titular da dívida (ex: "Minha", "Bia", "Joel") |
| `monthly` | numeric | Valor da parcela mensal |
| `ti` | integer | Total de parcelas contratadas |
| `paid` | integer | Parcelas já pagas |
| `rem` | integer | Parcelas restantes |
| `total` | numeric | Valor total ainda devedor |
| `due` | integer | Dia do vencimento (1 a 31) |
| `status` | text | Status: `active`, `urgent`, `overdue`, `negotiating`, `paused`, `paid` |
| `priority` | text | Prioridade: `Alta`, `Média`, `Baixa` |
| `note` | text | Anotações livres do usuário |
| `created_at` | timestamptz | Data de criação do registro |

**Índice**: `debts_user_id_idx` em `user_id` para performance.

### Tabela: `debt_payments`

Histórico imutável de cada parcela paga — registra a data e horário exatos do pagamento (`paid_at`), independente do que aconteça depois com a dívida (edição, reabertura, exclusão).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `user_id` | uuid | FK para `auth.users` — isolamento por usuário |
| `debt_id` | uuid | FK para `debts` (`ON DELETE CASCADE`) |
| `installment_number` | integer | Número da parcela paga (equivale ao `paid` da dívida no momento do pagamento) |
| `amount` | numeric | Valor pago (igual ao `monthly` da dívida no momento do pagamento) |
| `paid_at` | timestamptz | Data e horário exatos do pagamento (gerado pelo servidor) |

**Índices**: `debt_payments_debt_id_idx` em `debt_id` e `debt_payments_user_id_idx` em `user_id`.

### Tabela: `user_settings`

Configurações financeiras do usuário.

| Coluna | Tipo | Descrição |
|---|---|---|
| `user_id` | uuid | PK e FK para `auth.users` |
| `salary` | numeric | Salário mensal líquido |
| `cash_balance` | numeric | Reserva de emergência em caixa |
| `effective_date` | date | Data de vigência do salário informado |
| `updated_at` | timestamptz | Última atualização |

### Tabela: `audit_log`

Histórico imutável de todas as ações do usuário.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK para `auth.users` |
| `action` | text | Tipo de ação: `CRIAR`, `EDITAR`, `PAGAR`, `EXCLUIR`, `SALARIO`, `RESERVA` |
| `entity` | text | Entidade afetada: `divida`, `salario`, `reserva` |
| `entity_id` | uuid | ID da entidade modificada |
| `description` | text | Descrição legível por humanos |
| `old_value` | jsonb | Estado anterior (antes da alteração) |
| `new_value` | jsonb | Estado posterior (após a alteração) |
| `created_at` | timestamptz | Momento exato da ação |

**Índices**: `audit_log_user_id_idx` e `audit_log_created_at_idx DESC`.

### Segurança — Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem isolamento total entre usuários:

```sql
-- Exemplo: política aplicada à tabela debts
CREATE POLICY "Users can only access their own debts"
ON debts FOR ALL
USING (auth.uid() = user_id);
```

---

## 5. API — Rotas e Endpoints

**Base URL**: `/api`  
**Autenticação**: Header `Authorization: Bearer <JWT>` obrigatório em todas as rotas exceto `/auth`.

### Autenticação — `/api/auth`

#### `POST /api/auth/register`
Cria um novo usuário.

```json
// Request
{ "email": "user@email.com", "password": "senha123", "name": "Nome" }

// Response 201
{ "token": "<jwt>", "user": { "id": "uuid", "email": "user@email.com" }, "message": "Cadastro realizado" }

// Response 400 (erro do Supabase, ex: e-mail já cadastrado)
{ "error": "Não foi possível concluir o cadastro. Verifique os dados e tente novamente." }
```

A mensagem de erro do Supabase (`error.message`) não é mais repassada ao cliente — apenas logada no servidor — para evitar enumeração de e-mails cadastrados.

#### `POST /api/auth/login`
Autentica um usuário existente.

```json
// Request
{ "email": "user@email.com", "password": "senha123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "uuid", "email": "user@email.com" } }
```

---

### Dívidas — `/api/debts`

#### `GET /api/debts`
Retorna todas as dívidas do usuário autenticado, ordenadas por `created_at ASC`.

```json
// Response 200
[
  {
    "id": "uuid",
    "creditor": "Nubank",
    "cat": "Cartão de Crédito",
    "for_": "Minha",
    "monthly": 350.00,
    "ti": 12,
    "paid": 4,
    "rem": 8,
    "total": 2800.00,
    "due": 15,
    "status": "active",
    "priority": "Alta",
    "note": "",
    "created_at": "2025-01-10T..."
  }
]
```

#### `POST /api/debts`
Cria uma nova dívida. Gera registro em `audit_log` com action `CRIAR`.

```json
// Request
{
  "creditor": "Nubank",
  "cat": "Cartão de Crédito",
  "for_": "Minha",
  "monthly": 350.00,
  "ti": 12,
  "paid": 0,
  "rem": 12,
  "total": 4200.00,
  "due": 15,
  "status": "active",
  "priority": "Alta",
  "note": "Compras de dezembro"
}

// Response 201 — objeto da dívida criada
```

#### `PUT /api/debts/:id`
Atualiza uma dívida existente. Gera registro `EDITAR` em `audit_log` com `old_value` e `new_value`.

```json
// Request — campos parciais permitidos
{ "status": "paid", "rem": 0, "total": 0 }

// Response 200 — objeto atualizado
```

#### `DELETE /api/debts/:id`
Remove uma dívida. Gera registro `EXCLUIR` em `audit_log`.

```json
// Response 200
{ "ok": true }
```

#### `POST /api/debts/:id/pay`
Registra o pagamento da próxima parcela em aberto. Calcula e persiste `rem`, `total`, `paid` e `status` no servidor (evita cálculo duplicado/divergente no frontend), grava um registro em `debt_payments` com a data/horário exato (`paid_at`) e gera `PAGAR` em `audit_log`. Se a parcela paga for a última, `status` vira `paid` e a dívida passa a aparecer somente no Arquivo.

```json
// Response 200
{
  "debt": { "id": "uuid", "paid": 5, "rem": 7, "total": 2450.00, "status": "active", "...": "..." },
  "payment": { "id": "uuid", "debt_id": "uuid", "installment_number": 5, "amount": 350.00, "paid_at": "2026-07-06T14:32:00.000Z" }
}
```

#### `GET /api/debts/:id/payments`
Retorna o histórico de parcelas pagas de uma dívida, ordenado por `paid_at ASC`.

```json
// Response 200
[
  { "id": "uuid", "debt_id": "uuid", "installment_number": 1, "amount": 350.00, "paid_at": "2026-02-15T13:05:00.000Z" },
  { "id": "uuid", "debt_id": "uuid", "installment_number": 2, "amount": 350.00, "paid_at": "2026-03-15T09:40:00.000Z" }
]
```

---

### Configurações — `/api/settings`

#### `GET /api/settings`
Retorna as configurações financeiras do usuário.

```json
// Response 200
{
  "salary": 5000.00,
  "cash_balance": 1500.00,
  "effective_date": "2025-01-01"
}
```

#### `PUT /api/settings`
Atualiza salário e reserva. Usa `upsert`. Gera dois registros em `audit_log` (`SALARIO` e `RESERVA`).

```json
// Request
{
  "salary": 5500.00,
  "cash_balance": 2000.00,
  "effective_date": "2025-06-01"
}

// Response 200 — settings atualizadas
```

---

### Auditoria — `/api/audit`

#### `GET /api/audit?limit=100`
Retorna o histórico de ações do usuário, ordenado do mais recente para o mais antigo. Limite máximo: 500.

```json
// Response 200
[
  {
    "id": "uuid",
    "action": "EDITAR",
    "entity": "divida",
    "entity_id": "uuid",
    "description": "Dívida 'Nubank' editada — parcelas restantes: 8 → 7",
    "old_value": { "rem": 8, "total": 2800 },
    "new_value": { "rem": 7, "total": 2450 },
    "created_at": "2025-06-01T12:00:00Z"
  }
]
```

---

### Health Check

#### `GET /api/health`

```json
// Response 200
{ "ok": true }
```

---

## 6. Frontend — Telas e Componentes

### Tela 1: Dashboard

Visão geral consolidada da situação financeira.

**Métricas exibidas:**
- Salário mensal líquido configurado
- Total de dívidas ativas (soma dos saldos)
- Percentual de comprometimento de renda
- Próxima dívida a vencer (data mais próxima)

**Gráficos:**
- Gráfico de área — evolução da dívida total nos próximos 12 meses
- Gráfico de pizza — distribuição dos pagamentos mensais por categoria

**Alertas:**
- Banner de urgência para dívidas com status `urgent` ou `overdue`

---

### Tela 2: Dívidas

Gerenciamento completo das dívidas **em aberto**. Assim que uma dívida atinge o status `paid` (quitada) — seja pelo registro da última parcela (PayModal) ou pelo botão "✓ Quitar" — ela é automaticamente removida desta tela e passa a aparecer somente na tela **Arquivo** (Tela 6), para consulta.

**Funcionalidades:**
- Listagem em cards com informações resumidas (somente dívidas não quitadas)
- Filtros: status (Todas, Em aberto, Em atraso, Negociando), titular (`for_`), mês/ano de vencimento
- Busca por nome do credor
- Criação de nova dívida (modal)
- Edição de dívida existente (modal pré-preenchido)
- Registro de pagamento de parcela (PayModal) — grava data e horário exatos via `POST /api/debts/:id/pay`
- Consulta do histórico de parcelas pagas (componente `PaymentHistory`, exibido quando a dívida já tem ao menos 1 parcela paga)
- Exclusão com confirmação
- Badges coloridos por status

**Status disponíveis:**

| Status | Cor | Descrição |
|---|---|---|
| `active` | Azul | Dívida em pagamento regular |
| `urgent` | Laranja | Requer atenção imediata |
| `overdue` | Vermelho | Em atraso |
| `negotiating` | Roxo | Em processo de renegociação |
| `paused` | Cinza | Pagamentos pausados |
| `paid` | Verde | Quitada — sai da Gestão de Dívidas e vai para o Arquivo |

---

### Tela 3: Planejamento

Simulador de estratégia de quitação de dívidas.

**Funcionalidades:**
- Seleção de estratégia: **Snowball** (menor dívida primeiro) ou **Avalanche** (maior parcela primeiro)
- Input de salário para simulação (independente do salário cadastrado)
- Breakdown orçamentário: moradia (30%), dívidas (40%), saldo disponível
- Gráfico de projeção de 12 meses mostrando evolução do saldo devedor
- Destaque da próxima dívida a ser quitada

**Fórmulas:**
- Comprometimento mensal = Σ(parcelas ativas) / salário × 100
- Projeção = simula pagamentos mensais deduzindo as parcelas do saldo devedor em cada mês

---

### Tela 4: Inteligência

Análise inteligente da saúde financeira do usuário.

**Score de Risco:**
- Calculado de 0 a 100 com base em:
  - % de comprometimento de renda
  - Número de dívidas em atraso
  - Prioridade das dívidas ativas
- Exibido com gradiente de cor: verde (baixo) → vermelho (crítico)

**Alertas Automáticos:**
- Dívidas em atraso — ação imediata
- Comprometimento acima de 30% da renda
- Dívidas com 1-2 parcelas restantes (quase quitadas!)
- Superendividamento (≥ 5 dívidas ativas) — referência à Lei 14.181/2021

**Recomendações Personalizadas:**
- Geradas automaticamente com base no perfil do usuário
- Até 6 recomendações priorizadas
- Links para recursos externos: consumer.gov.br, Procon, detalhes da lei

---

### Tela 5: Relatórios

Exportação e visualização de dados históricos.

**Gráficos:**
- Barras — histórico de pagamentos dos últimos 6 meses
- Pizza — distribuição por categoria de dívida

**Exportação Excel:**
Gera arquivo `.xlsx` com 3 abas:
1. **Dívidas Detalhadas** — lista completa com todos os campos
2. **Resumo** — totais e médias por categoria
3. **Histórico Mensal** — evolução dos pagamentos

**Exportação PDF:**
- Preview em modal antes de exportar
- Inclui tabela de dívidas e métricas resumidas
- Responsivo: em telas ≤640px a barra de ações quebra linha e a tabela de dívidas rola horizontalmente dentro de um contêiner com `overflow-x:auto` (largura mínima de 720px preservada para legibilidade)

---

### Tela 6: Arquivo

Consulta de dívidas quitadas (status `paid`). Não faz parte da Gestão de Dívidas — é o destino automático de qualquer dívida assim que é totalmente paga.

**Funcionalidades:**
- Listagem somente-consulta das dívidas com status `paid`
- Busca por nome do credor ou categoria
- Total de valor quitado (Σ parcelas pagas × valor da parcela)
- Histórico de parcelas pagas por dívida (componente `PaymentHistory`), com data e horário de cada pagamento (`debt_payments.paid_at`)
- "↩ Reabrir" — retorna a dívida para a Gestão de Dívidas (status volta a `active`)
- Exclusão definitiva com confirmação

---

### Tela 7: Auditoria

Log completo e filtrado de todas as ações do usuário.

**Funcionalidades:**
- Filtro por tipo de ação: TODOS, CRIAR, EDITAR, PAGAR, EXCLUIR, SALARIO, RESERVA
- Cards de contagem por tipo de ação
- Timeline cronológica (mais recente primeiro)
- Comparação antes/depois para cada alteração
- Timestamps precisos
- Paginação client-side: 15 registros por página, com navegação "Anterior"/"Próxima" (reinicia para a página 1 ao trocar o filtro)

---

### Componentes Compartilhados

| Componente | Descrição |
|---|---|
| `StatCard` | Card com ícone, valor principal e subtexto |
| `Badge` | Tag colorida para status e categorias |
| `SectionTitle` | Cabeçalho de seção com título e subtítulo |
| `ChartCard` | Container responsivo para gráficos Recharts |
| `BrandLogo` | Logo do FinanceOS (variantes texto e ícone) |
| `Toast` | Notificações de sucesso/erro/info temporárias |
| `Sidebar` | Navegação lateral com menu e toggle de tema |
| `PaymentHistory` | Lista expansível com data/horário e valor de cada parcela paga de uma dívida (usa `GET /api/debts/:id/payments`) |

### Modais

| Modal | Função |
|---|---|
| `AddDebtModal` | Formulário para criar ou editar dívida |
| `PayModal` | Confirmação de pagamento de parcela |
| `SalaryModal` | Atualização de salário e reserva de emergência |
| `PDFPreview` | Visualização e exportação do relatório PDF |

---

## 7. Autenticação e Segurança

### Fluxo de Autenticação

```
1. POST /api/auth/login → { email, password }
2. Backend chama Supabase Auth signInWithPassword()
3. Supabase valida credenciais e retorna session.access_token (JWT)
4. Backend retorna { token, user } para o frontend
5. Frontend salva token em localStorage (chave: fos-token)
6. Todas as requisições seguintes incluem: Authorization: Bearer <token>
7. Middleware auth.js valida token antes de processar cada rota
8. Supabase.auth.getUser(token) confirma validade e retorna user_id
9. user_id é injetado nas queries para filtrar dados do usuário
```

### Camadas de Segurança

| Camada | Mecanismo | Proteção |
|---|---|---|
| **Transporte** | HTTPS (Supabase) | Criptografia em trânsito |
| **Autenticação** | JWT com expiração | Tokens temporários |
| **Autorização API** | Middleware obrigatório | Toda rota protegida |
| **Banco de Dados** | RLS `auth.uid() = user_id` | Isolamento total entre usuários |
| **Serviço** | Service Role Key no backend | Controle server-side, nunca exposta ao browser |

### Armazenamento Local (localStorage)

| Chave | Conteúdo | Uso |
|---|---|---|
| `fos-token` | JWT de autenticação | Enviado em toda requisição |
| `fos-email` | E-mail do usuário logado | Exibição na interface |
| `fos-dark` | `0` ou `1` | Preferência de tema |
| `fos-cats` | Array JSON | Categorias customizadas de dívidas |
| `fos-fors` | Array JSON | Titulares customizados de dívidas |

---

## 8. Funcionalidades Detalhadas

### Gestão de Parcelas

Cada dívida possui controle preciso de parcelas:

```
ti  (total installments)  = Total de parcelas contratadas
paid (paid)               = Parcelas já pagas
rem  (remaining)          = Parcelas restantes = ti - paid
total                     = Valor restante = rem × monthly

Ao registrar um pagamento (POST /api/debts/:id/pay, calculado no servidor):
  paid  += 1
  rem   -= 1
  total -= monthly
  Se rem == 0: status → "paid" (dívida sai da Gestão de Dívidas e vai para o Arquivo)

  Além disso, é criado um registro em debt_payments:
    installment_number = paid (após o incremento)
    amount              = monthly
    paid_at              = data/horário exatos do servidor no momento do pagamento

  Esse histórico é imutável e consultável a qualquer momento (componente PaymentHistory),
  mesmo que a dívida seja depois reaberta, editada ou volte a ficar em aberto.
```

### Cálculo de Comprometimento de Renda

```
comprometimento (%) = (Σ monthly de dívidas ativas / salary) × 100

Referências:
  < 20%  → Saudável (verde)
  20-30% → Atenção (amarelo)
  > 30%  → Crítico (vermelho)
```

### Score de Risco Financeiro

```
score = base 0-100

Fatores considerados:
  + comprometimento de renda (peso maior)
  + dívidas com status "overdue" (peso alto)
  + dívidas com status "urgent"
  + dívidas com prioridade "Alta"

Score 0-30:   Baixo risco  (verde)
Score 31-60:  Risco médio  (amarelo)
Score 61-100: Alto risco   (vermelho)
```

### Estratégias de Quitação (Planejamento)

**Snowball (Bola de Neve)**
- Ordena dívidas do menor para o maior saldo devedor
- Quita as menores primeiro para gerar motivação psicológica
- Libera parcelas que são redirecionadas para a próxima dívida

**Avalanche**
- Ordena dívidas da maior para a menor parcela mensal
- Prioriza quitar o que "pesa mais" no orçamento mensal
- Matematicamente mais eficiente em reduzir custo total

### Exportação Excel (3 abas)

```
Aba 1 — Dívidas Detalhadas
  Credor | Categoria | Titular | Parcela | Total Pago | Restante | Vencimento | Status | Prioridade

Aba 2 — Resumo
  Total de dívidas | Soma mensal | Soma total | Por status | Por categoria

Aba 3 — Histórico Mensal
  Mês/Ano | Parcelas pagas | Valor quitado
```

---

## 9. Estrutura de Diretórios

```
c:\Projetos\financeiro\
│
├── vercel.json                       # Config do projeto único: builds (backend + frontend) e routes
├── backend/                          # Servidor API Express.js
│   ├── app.js                        # Instância Express — middlewares e rotas (sem listen)
│   ├── server.js                     # Entry point local — importa app.js e chama app.listen()
│   ├── api/
│   │   └── index.js                  # Entry point serverless — exporta app.js para a Vercel
│   ├── package.json                  # Dependências e scripts do backend
│   ├── .env                          # Variáveis de ambiente (não versionar!)
│   ├── .env.example                  # Modelo das variáveis de ambiente necessárias
│   ├── middleware/
│   │   └── auth.js                   # Valida JWT em toda requisição protegida
│   └── routes/
│       ├── auth.js                   # POST /login, POST /register
│       ├── debts.js                  # GET/POST/PUT/DELETE /debts, POST /debts/:id/pay, GET /debts/:id/payments
│       ├── settings.js               # GET/PUT /settings
│       ├── audit.js                  # GET /audit
│       └── email.js                  # POST /email/send-report — envio de relatório por e-mail (SMTP)
│
├── frontend/                         # SPA React + Vite
│   ├── index.html                    # HTML shell
│   ├── vite.config.js                # Proxy /api → :3001 em dev
│   ├── package.json                  # Dependências e scripts do frontend
│   ├── .env.example                  # Modelo da variável VITE_API_URL (URL do backend em produção)
│   └── src/
│       ├── main.jsx                  # Monta o React no DOM
│       ├── App.jsx                   # Componente raiz — estado global, roteamento
│       ├── constants.js              # Temas, cores, formatadores, itens de menu
│       ├── lib/
│       │   └── api.js                # Cliente HTTP — fetch wrapper com auth header
│       ├── components/
│       │   ├── Dashboard.jsx         # Tela: visão geral financeira
│       │   ├── Dividas.jsx           # Tela: gestão de dívidas
│       │   ├── Planejamento.jsx      # Tela: simulador de quitação
│       │   ├── Inteligencia.jsx      # Tela: score e recomendações
│       │   ├── Relatorios.jsx        # Tela: relatórios e exportação
│       │   ├── Arquivo.jsx           # Tela: consulta de dívidas quitadas
│       │   ├── Auditoria.jsx         # Tela: log de auditoria
│       │   ├── AuthScreen.jsx        # Tela: login e cadastro
│       │   ├── Sidebar.jsx           # Navegação lateral
│       │   ├── Toast.jsx             # Notificações temporárias
│       │   ├── shared/               # Componentes reutilizáveis
│       │   │   ├── Badge.jsx
│       │   │   ├── StatCard.jsx
│       │   │   ├── SectionTitle.jsx
│       │   │   ├── ChartCard.jsx
│       │   │   ├── BrandLogo.jsx
│       │   │   └── PaymentHistory.jsx
│       │   └── modals/               # Diálogos modais
│       │       ├── AddDebtModal.jsx
│       │       ├── PayModal.jsx
│       │       ├── SalaryModal.jsx
│       │       └── PDFPreview.jsx
│       └── public/                   # Assets estáticos
│
└── supabase/                         # Migrações do banco de dados
    ├── schema.sql                    # Tabela debts + RLS
    ├── migration_audit.sql           # Tabelas audit_log e user_settings
    ├── migration_effective_date.sql  # Coluna effective_date em user_settings
    └── migration_debt_payments.sql   # Tabela debt_payments + RLS (histórico de pagamentos)
```

---

## 10. Configuração e Execução

### Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Supabase](https://supabase.com) com projeto criado

### 1. Configurar o Banco de Dados

No Supabase SQL Editor, execute os scripts na ordem:

```sql
-- 1. Schema principal
supabase/schema.sql

-- 2. Tabelas de auditoria e configurações
supabase/migration_audit.sql

-- 3. Coluna de data de vigência
supabase/migration_effective_date.sql

-- 4. Histórico de pagamentos de parcelas
supabase/migration_debt_payments.sql
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` (ver seção 11).

```bash
npm run dev    # Inicia com auto-reload em localhost:3001
# ou
npm start      # Produção
```

### 3. Configurar o Frontend

```bash
cd frontend
npm install
npm run dev    # Dev server em localhost:5173 com proxy para :3001
```

### 4. Acessar o Sistema

- **Desenvolvimento**: http://localhost:5173
- **Backend direto**: http://localhost:3001/api/health

### Scripts Disponíveis

| Pasta | Comando | Ação |
|---|---|---|
| `backend` | `npm run dev` | Inicia com Node.js --watch (auto-reload) |
| `backend` | `npm start` | Inicia sem auto-reload |
| `frontend` | `npm run dev` | Dev server Vite na porta 5173 |
| `frontend` | `npm run build` | Build de produção em `dist/` |
| `frontend` | `npm run preview` | Preview do build de produção |

---

## 11. Variáveis de Ambiente

Arquivo `backend/.env`:

```env
# Porta do servidor Express
PORT=3001

# URL do projeto Supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co

# Chave de serviço do Supabase (nunca expor ao browser!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Origem permitida pelo CORS (endereço do frontend)
CORS_ORIGIN=http://localhost:5173
```

> **Segurança**: O arquivo `.env` não deve ser versionado. A `SUPABASE_SERVICE_ROLE_KEY` concede acesso total ao banco e deve permanecer exclusivamente no backend.

Arquivo `frontend/.env`:

```env
# URL absoluta do backend em produção (ex: https://financeos-backend.vercel.app/api)
# Em desenvolvimento pode ficar vazio — o proxy do Vite cuida de /api.
VITE_API_URL=
```

---

## 12. Banco de Dados — Migrations

### `schema.sql` — Schema Principal

```sql
-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de dívidas com RLS
CREATE TABLE debts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor text NOT NULL,
  cat text DEFAULT 'Outros',
  for_ text DEFAULT 'Minha',
  monthly numeric DEFAULT 0,
  ti integer DEFAULT 0,
  paid integer DEFAULT 0,
  rem integer DEFAULT 0,
  total numeric DEFAULT 0,
  due integer,
  status text DEFAULT 'active',
  priority text DEFAULT 'Média',
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX debts_user_id_idx ON debts (user_id);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own debts" ON debts
  FOR ALL USING (auth.uid() = user_id);
```

### `migration_audit.sql` — Auditoria e Configurações

```sql
-- Configurações financeiras do usuário
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  salary numeric DEFAULT 0,
  cash_balance numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Log de auditoria imutável
CREATE TABLE audit_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX audit_log_user_id_idx ON audit_log (user_id);
CREATE INDEX audit_log_created_at_idx ON audit_log (created_at DESC);
```

### `migration_effective_date.sql` — Data de Vigência

```sql
-- Adiciona data de vigência do salário
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS effective_date date;
```

### `migration_debt_payments.sql` — Histórico de Pagamentos

```sql
-- Histórico imutável de cada parcela paga (data e horário exatos)
CREATE TABLE debt_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_debt_payments" ON debt_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX debt_payments_debt_id_idx ON debt_payments (debt_id);
CREATE INDEX debt_payments_user_id_idx ON debt_payments (user_id);
```

---

## 13. Deploy no Vercel

O projeto é publicado como **um único projeto Vercel**, com Root Directory na raiz do repositório. O arquivo `vercel.json` (raiz) usa a configuração `builds`/`routes` para combinar o build estático do frontend com a função serverless do backend num só domínio:

```json
{
  "builds": [
    { "src": "backend/api/index.js", "use": "@vercel/node" },
    { "src": "frontend/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/backend/api/index.js" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ]
}
```

- `backend/app.js` contém a instância Express (middlewares, rotas); `backend/server.js` a usa localmente com `app.listen()`.
- `backend/api/index.js` reexporta `app.js` como função serverless — é o entry point que a Vercel invoca via `@vercel/node`, que resolve as dependências a partir de `backend/package.json`.
- `frontend/package.json` é buildado via `@vercel/static-build` (roda `npm run build`, publica `frontend/dist`).
- Toda requisição a `/api/*` é roteada para a função do backend; todo o restante serve os arquivos estáticos do frontend — logo frontend e backend ficam no mesmo domínio (same-origin), e `VITE_API_URL` pode ficar vazio (usa o padrão relativo `/api`).
- Variáveis de ambiente a configurar no painel da Vercel (um único projeto): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, `SMTP_*`.

---

## Paleta de Cores

| Cor | Hex | Uso |
|---|---|---|
| Indigo (Primary) | `#6366F1` | Elementos primários, navegação |
| Emerald (Success) | `#10B981` | Status pago, saldo positivo |
| Amber (Warning) | `#F59E0B` | Alertas, urgência |
| Red (Danger) | `#EF4444` | Erros, dívidas em atraso |
| Cyan (Accent) | `#0EA5E9` | Destaques secundários, gráficos |

---

*Documentação gerada em 27/05/2026 — FinanceOS v1.0*
