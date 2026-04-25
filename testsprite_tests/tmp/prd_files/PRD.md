# PRD - LegalFlow: Plataforma de Gestão Jurídica

## 1. Visão Geral do Produto
O **LegalFlow** é uma solução SaaS (Software as a Service) projetada para modernizar a gestão de escritórios de advocacia no Brasil. A plataforma centraliza processos, clientes, documentos e finanças em uma interface intuitiva e responsiva.

## 2. Público-Alvo
*   Advogados autônomos.
*   Pequenos e médios escritórios de advocacia.
*   Departamentos jurídicos que buscam organização e automação.

## 3. Requisitos Funcionais

### 3.1. Gestão de Clientes
*   **Cadastro**: Suporte a Pessoa Física (CPF) e Pessoa Jurídica (CNPJ).
*   **Histórico**: Visualização de todos os processos, notas e registros financeiros vinculados ao cliente.
*   **Segurança**: Isolamento total de dados entre diferentes escritórios (Multi-tenancy).

### 3.2. Gestão de Processos (Kanban)
*   **Visualização**: Quadro Kanban para acompanhamento de status.
*   **Automação**: Atualização automática de prazos e notificações de movimentação.
*   **Detalhes**: Armazenamento de número do processo, tribunal, área do direito e responsáveis.

### 3.3. Módulo Financeiro
*   **Fluxo de Caixa**: Registro de receitas, despesas e repasses.
*   **Honorários**: Gestão de pagamentos e contratos financeiros.
*   **Relatórios**: Geração de demonstrativos financeiros em PDF.

### 3.4. Agenda e Calendário
*   **Audiências**: Calendário centralizado para prazos e compromissos.
*   **Integração**: Sincronização com Google Calendar.

### 3.5. Inteligência Artificial
*   **Relatórios**: Geração automática de resumos de processos e relatórios de desempenho para clientes.

## 4. Requisitos Não Funcionais
*   **Segurança**: Autenticação via JWT e criptografia de dados sensíveis.
*   **Performance**: Interface frontend ultrarrápida utilizando Vite e React.
*   **Escalabilidade**: Backend em NestJS preparado para múltiplos usuários simultâneos.
*   **Responsividade**: Mobile-first design para acesso em qualquer dispositivo.

## 5. Arquitetura Técnica
*   **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion.
*   **Backend**: NestJS, Prisma ORM, Node.js.
*   **Banco de Dados**: PostgreSQL (Produção) / SQLite (Desenvolvimento).
*   **Infraestrutura**: Docker para containerização e Vercel para deployment.

## 6. Critérios de Aceite para Testes
1.  **Multi-tenancy**: Um usuário do Escritório A não pode, sob nenhuma circunstância, visualizar dados do Escritório B.
2.  **Integridade**: O cadastro de um novo processo deve vincular-se corretamente ao cliente selecionado.
3.  **Disponibilidade**: O sistema deve manter as rotas de API protegidas e retornar erro 401 para requisições sem token válido.
