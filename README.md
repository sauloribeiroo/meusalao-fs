# MeuSalão

Marketplace digital de serviços de beleza — descoberta local e agendamento direto.

## Sobre o projeto

O MeuSalão é uma aplicação web full-stack, mobile-first, que conecta clientes a salões de beleza próximos, centralizando em um único lugar a oferta de serviços, preços, avaliações e agendamento.

Hoje, encontrar um salão depende de indicação, boca a boca ou tentativa e erro, e comparar preços, serviços e horários exige ligar para vários estabelecimentos ou trocar mensagens no WhatsApp. Do lado dos salões, atrair clientes novos é difícil sem presença digital, e a gestão manual de agenda (caderno e WhatsApp) gera conflitos de horário e faltas.

O MeuSalão resolve essas dores oferecendo transparência de preços, avaliações reais e confirmação imediata de horário — sem exigir que o salão adote um ERP complexo nem que o cliente use múltiplos aplicativos.

Este repositório cobre o MVP (Fase 1) do produto, com três perfis de usuário:

- **Cliente** — busca serviços de beleza por proximidade, compara salões, agenda horários, acompanha seus agendamentos e avalia o atendimento.
- **Dono de Salão** — cadastra o salão, serviços, preços e horários, publica o perfil público, gerencia a agenda e confirma ou recusa agendamentos.
- **Administrador** — gerencia usuários e salões e modera avaliações/conteúdo da plataforma.

## Funcionalidades

### Para clientes

- Cadastro, login (e-mail/senha ou Google) e recuperação de senha.
- Busca de salões por nome ou tipo de serviço.
- Filtros por categoria (corte, coloração, manicure, barba, estética, infantil etc.), distância, preço, avaliação mínima e disponibilidade ("aberto agora").
- Visualização dos salões em um mapa, com base em geolocalização.
- Perfil do salão com descrição, serviços, preços, duração, avaliações, endereço, telefone e horário de funcionamento.
- Comparação entre salões selecionados.
- Agendamento de horário (escolha de serviço, dia e horário disponíveis).
- Acompanhamento e cancelamento dos próprios agendamentos.
- Avaliação do salão (nota de 1 a 5 e comentário) após o atendimento concluído.

### Para donos de salão

- Cadastro guiado (onboarding) em etapas: dados do salão, serviços, horários e publicação do perfil.
- Cadastro de serviços com nome, preço e duração.
- Importação de catálogo de serviços via planilha (CSV), com pré-visualização e confirmação.
- Configuração de horários de funcionamento por dia da semana.
- Publicação do perfil público, tornando o salão visível na busca e no mapa.
- Painel com métricas (agendamentos do dia/semana, clientes, receita) e agenda do dia.
- Gerenciamento dos agendamentos recebidos (confirmar ou recusar).

### Para administradores

- Gestão de usuários e salões.
- Moderação de avaliações e conteúdo da plataforma.

## Tecnologias

O MeuSalão é construído como uma aplicação full-stack em um único projeto Next.js, organizada em três camadas: apresentação (frontend), aplicação (API) e dados.

**Frontend**
- [Next.js](https://nextjs.org/) (App Router), combinando Server Components e Client Components
- [React](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) para estilização utilitária
- [shadcn/ui](https://ui.shadcn.com/) para componentes acessíveis
- [lucide-react](https://lucide.dev/) para ícones

**Backend (API)**
- Route Handlers do Next.js (`app/api`), em Node.js, expondo uma API REST/JSON
- Camada de serviços dedicada, concentrando as regras de negócio (isolada do framework)
- [Zod](https://zod.dev/) para validação de dados no servidor

**Dados**
- [PostgreSQL](https://www.postgresql.org/) como banco de dados relacional
- [Prisma ORM](https://www.prisma.io/) para modelagem, client tipado e migrações versionadas

**Autenticação e segurança**
- [Auth.js (NextAuth)](https://authjs.dev/) — login por e-mail/senha (hash com bcrypt) e login social com Google
- Sessão baseada em token (JWT) ou cookie httpOnly
- Autorização por papel de usuário (Cliente, Dono de Salão, Administrador)
- Comunicação via HTTPS e conformidade com a LGPD

**Infraestrutura e ferramentas**
- Node.js (LTS) e npm/pnpm
- Versionamento no GitHub
- Deploy contínuo na [Vercel](https://vercel.com/)
- Banco de dados local via Docker ou serviço gerenciado (ex.: Neon, Supabase, Railway)

## Como rodar o projeto

Pré-requisitos: Node.js LTS (20+) e um PostgreSQL acessível (Docker local ou serviço gerenciado).

```bash
npm install
cp .env.example .env     # preencha DATABASE_URL e AUTH_SECRET
npx auth secret          # gera o AUTH_SECRET
npm run db:migrate       # cria as tabelas
npm run dev              # http://localhost:3000
```

O login com Google é opcional: sem `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` no `.env`, o botão simplesmente não aparece e o login por e-mail/senha continua funcionando.

Scripts disponíveis: `dev`, `build`, `start`, `lint`, `typecheck`, `db:migrate`, `db:generate`, `db:studio`.

## Estrutura de pastas

```
prisma/schema.prisma          modelo de dados (Usuario, Conta)
src/
  app/
    (auth)/                   login e cadastro (layout com a marca)
    (app)/                    área autenticada (layout com cabeçalho)
    api/auth/[...nextauth]/   Route Handler do Auth.js
  acoes/                      Server Actions (entrar, cadastrar, sair)
  services/                   regras de negócio em TS puro, sem Next
  components/ui/              componentes base no padrão shadcn/ui
  auth.ts                     configuração do Auth.js (providers e callbacks)
  auth.config.ts              parte leve da config, compartilhada com o middleware
  middleware.ts               proteção de rotas antes da renderização
```

## Status — Sprint 1

Entregue nesta sprint:

- Cadastro por e-mail/senha, com validação (Zod) e senha guardada como hash (bcrypt).
- Login por e-mail/senha e, quando configurado, login social com Google.
- Sessão em JWT via cookie httpOnly, com o papel do usuário incluído no token.
- Proteção de rotas no middleware: visitante em rota privada vai para `/login`; usuário logado em `/login` ou `/cadastro` vai para `/inicio`.
- Tela inicial (`/inicio`) com saudação, cabeçalho com logout, categorias de serviço e os espaços de busca e de salões próximos.

A busca de salões, o mapa, os filtros e o agendamento entram nas sprints seguintes — por isso o campo de busca e a lista de salões aparecem desabilitados na tela inicial.

### Por que Next.js full-stack em vez de backend separado?

Foi avaliada a alternativa de um backend separado (API em Node.js/Express) consumido por um frontend Next.js. A equipe optou pela abordagem full-stack em um único projeto por reduzir a complexidade de infraestrutura, simplificar o deploy (um único projeto na Vercel) e compartilhar tipos entre frontend e backend — adequado ao porte da equipe e ao prazo do MVP.

Como mitigação de risco, toda a regra de negócio fica isolada na camada de serviços (`services/`), escrita em Node/TypeScript puro, sem acoplamento ao Next.js. Isso permite extrair um backend dedicado no futuro (ex.: Express/NestJS), reaproveitando as regras de negócio já implementadas, caso o produto evolua para exigir WebSockets, filas/workers ou uma API pública para múltiplos clientes.

---

*Baseado no Documento de Requisitos do Produto (PRD) MeuSalão v2.0.*
