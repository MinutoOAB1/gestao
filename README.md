# LegalFlow - Plataforma de Gestão Jurídica

<div align="center">
  <h3>🏛️ Sistema completo para gestão de escritórios de advocacia</h3>
  <p>Processos • Clientes • Contratos • Agenda • Financeiro</p>
</div>

---

## 📋 Visão Geral

**LegalFlow** é uma plataforma SaaS moderna para gestão jurídica, desenvolvida com tecnologias de ponta para oferecer uma experiência premium a advogados e escritórios de advocacia.

### ✨ Funcionalidades Principais

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão consolidada de métricas, receitas e próximos eventos |
| **Processos** | Gestão de processos com Kanban, filtros e prazos |
| **Clientes** | Cadastro completo de clientes (PF/PJ) com histórico |
| **Contratos** | Funil de conversão, status e geração de documentos |
| **Agenda** | Calendário de audiências, reuniões e prazos |
| **Financeiro** | Controle de receitas, despesas e repasses |
| **Documentos** | Upload e organização de arquivos por processo |

---

## 🚀 Instalação Rápida

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- **Git**

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/legalflow.git
cd legalflow
```

### 2. Configure o Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Gere o Prisma Client e aplique as migrações
npx prisma generate
npx prisma db push

# (Opcional) Popule o banco com dados de exemplo
npx prisma db seed

# Inicie o servidor de desenvolvimento
npm run start:dev
```

O backend estará disponível em `http://localhost:3000`

### 3. Configure o Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev -- --host
```

O frontend estará disponível em `http://localhost:5173`

---

## ⚙️ Variáveis de Ambiente

### Backend (`.env`)

```env
# Banco de dados SQLite (padrão)
DATABASE_URL="file:./dev.db"

# JWT Secret (gere uma string segura para produção)
JWT_SECRET="sua-chave-secreta-aqui"

# Porta do servidor
PORT=3000
```

---

## 📁 Estrutura do Projeto

```
legalflow/
├── backend/                 # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco de dados
│   │   └── seed.ts         # Dados de exemplo
│   └── src/
│       ├── auth/           # Autenticação JWT
│       ├── clients/        # Módulo de clientes
│       ├── processes/      # Módulo de processos
│       ├── contracts/      # Módulo de contratos
│       ├── financial/      # Módulo financeiro
│       ├── agenda/         # Módulo de agenda
│       └── documents/      # Módulo de documentos
│
├── frontend/               # App React + Vite
│   └── src/
│       ├── components/     # Componentes reutilizáveis
│       ├── pages/          # Páginas da aplicação
│       ├── contexts/       # Contextos React (Auth)
│       └── services/       # Serviços de API
│
└── docker-compose.yml      # Configuração Docker
```

---

## 🔧 Comandos Úteis

### Backend

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Inicia em modo desenvolvimento (watch) |
| `npm run build` | Compila para produção |
| `npm run start:prod` | Inicia versão de produção |
| `npx prisma generate` | Regenera o Prisma Client |
| `npx prisma db push` | Aplica alterações do schema |
| `npx prisma studio` | Abre interface visual do banco |

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila para produção |
| `npm run preview` | Visualiza build de produção |
| `npx tsc --noEmit` | Verifica erros de TypeScript |

---

## 🔐 Autenticação

A plataforma utiliza **JWT (JSON Web Tokens)** para autenticação:

1. Faça login em `/login` com email e senha
2. O token é armazenado no `localStorage`
3. Todas as requisições incluem o token no header `Authorization`

### Usuário de Teste

Após rodar o seed, você pode usar:
- **Email:** `admin@legalflow.com`
- **Senha:** `admin123`

---

## 📱 Responsividade

A plataforma é **totalmente responsiva** e otimizada para:

- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (até 767px)

### Padrões Mobile Implementados

- **Bottom Navigation** para facilitar uso com uma mão
- **FABs (Floating Action Buttons)** para ações principais
- **Cards colapsáveis** em telas menores
- **Scroll horizontal** para tabelas e Kanban
- **Touch-friendly** com áreas de toque adequadas

---

## 🛠️ Tecnologias

### Frontend
- **React 18** + TypeScript
- **Vite** (bundler ultrarrápido)
- **Tailwind CSS** (estilização)
- **Framer Motion** (animações)
- **React Router v6** (navegação)
- **Axios** (requisições HTTP)

### Backend
- **NestJS** (framework Node.js)
- **Prisma** (ORM)
- **SQLite** (banco de dados)
- **Passport JWT** (autenticação)

---

## 📊 Módulos em Detalhe

### Processos (Kanban)

- Arraste e solte cards entre colunas
- Colunas personalizáveis (adicionar/editar/excluir)
- Filtros por área, responsável e prazo
- Indicadores visuais de urgência

### Financeiro

- Dashboard com saldo, receitas e despesas
- Gráficos de fluxo de caixa
- Gestão de parceiros (correspondentes)
- Relatórios em PDF

### Agenda

- Visualização por dia/semana/mês
- Filtros por tipo de evento
- Arraste para reagendar eventos (em desenvolvimento)

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- **Email:** suporte@legalflow.com.br
- **Documentação:** [docs.legalflow.com.br](https://docs.legalflow.com.br)

---

<div align="center">
  <p>Feito com ❤️ para advogados brasileiros</p>
  <p><strong>LegalFlow</strong> © 2024</p>
</div>
