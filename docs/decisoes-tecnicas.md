# Decisões Técnicas — MeuSalão

Resumo técnico para o desenvolvimento. A especificação completa está no PRD
(`docs/PRD_MeuSalao_v2.0.docx`). Este arquivo é a referência rápida de stack e
arquitetura para quem for implementar.

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript, Tailwind CSS, shadcn/ui, lucide-react.
- **Backend:** Next.js full-stack — Route Handlers em `app/api/**/route.ts` (Node.js), API REST/JSON.
- **ORM / Banco:** Prisma sobre **PostgreSQL** (local via Docker ou gerenciado: Neon/Supabase/Railway).
- **Autenticação:** Auth.js (NextAuth) — e-mail/senha (hash bcrypt) e Google opcional.
- **Validação:** Zod no servidor.
- **Deploy:** Vercel. **Versionamento:** GitHub.

## Decisão arquitetural (registro)

**Adotado: Next.js full-stack (um único projeto)** em vez de backend Express separado.

- **Motivo:** equipe pequena, tempo de dedicação limitado, prazo do MVP e escopo
  essencialmente CRUD + autenticação. Menos infraestrutura e menor custo de manutenção.
- **Porta de saída (mitigação):** toda regra de negócio fica isolada na camada
  `services/` (Node/TS puro, sem acoplamento ao Next.js). Route Handlers são "finos"
  (recebem a requisição, validam com Zod, delegam ao serviço). Se um dia precisar de
  backend dedicado, basta reaproveitar `services/` em uma app Express/NestJS.
- Necessidades que pediriam back separado (WebSockets, filas/workers, API pública para
  múltiplos clientes) **não** fazem parte da Fase 1 (MVP).

## Padrão de fluxo

- **Ler para exibir** (perfil do salão, listagens): Server Component chama o Prisma direto.
- **Escrever / agir** (agendar, cancelar, avaliar, cadastrar): Client Component faz
  `fetch("/api/...")` → Route Handler → Auth.js (sessão + papel) → Zod → `services/` → Prisma → PostgreSQL.

## Modelo de dados (entidades)

- **Usuario:** id, nome, email (único), telefone, senhaHash, papel (CLIENTE | DONO_SALAO | ADMIN), criadoEm.
- **Salao:** id, donoId→Usuario, nome, descricao, endereco, telefone, latitude, longitude, tipo, publicado, criadoEm.
- **Servico:** id, salaoId→Salao, nome, preco, duracaoMin.
- **HorarioFuncionamento:** id, salaoId→Salao, diaSemana, horaAbertura, horaFechamento, ativo.
- **Agendamento:** id, clienteId→Usuario, salaoId→Salao, servicoId→Servico, dataHora, status (CONFIRMADO | CANCELADO | CONCLUIDO), criadoEm. **Unicidade `@@unique([salaoId, dataHora])`** (impede horário duplo — RGN02).
- **Avaliacao:** id, clienteId→Usuario, salaoId→Salao, agendamentoId (único)→Agendamento, nota, comentario, criadoEm.

O schema Prisma completo está na seção 5.5 do PRD.

## Regras de negócio-chave

- Agendar só em horário dentro do funcionamento configurado e não ocupado (RGN01/RGN02).
- Avaliar só agendamento **concluído**, uma por agendamento (RGN03).
- Cancelar só enquanto **confirmado** (RGN04).
- Salão só aparece na busca após **publicar** o perfil (RGN05).
- Salão sem preço → exibe "Consultar preço" (RGN06).
- Senha: mínimo 8 caracteres, letras + números, armazenada com hash (RGN08).

## Escopo — o que NÃO tem no MVP

- **Sem notificações** push/WhatsApp e **sem lembretes automáticos**.
- E-mail usado **apenas** para confirmação de cadastro e recuperação de senha.
- Acompanhamento dos horários marcados é feito na aba **"Meus Agendamentos"** (RF17).

## Estrutura de pastas (alvo)

```
meusalao/
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── (cliente)/        # busca, perfil, agendar, meus agendamentos
│   │   ├── (salao)/          # onboarding, dashboard, agenda
│   │   ├── api/**/route.ts   # backend (finos)
│   │   └── layout.tsx
│   ├── components/           # UI (shadcn/ui)
│   ├── services/            # regras de negócio (Node/TS puro)
│   └── lib/                  # prisma.ts, auth.ts, validators.ts (Zod)
└── .env                      # DATABASE_URL, credenciais de auth
```

