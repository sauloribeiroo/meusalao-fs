# Contrato da API — Sprint 2

Endpoints entregues na Sprint 2 (backend). Serve de referência para as telas
#19 (calendário de disponibilidade), #21 (confirmação de agendamento), #29
(cadastro de serviços) e #33 (configuração de horários).

Todas as respostas são JSON. Valores monetários vão como número (`80.5`) ou
`null` — `null` significa "Consultar preço" (RGN06).

## Autenticação

A sessão é a do Auth.js, em cookie `httpOnly`. Em chamada feita do navegador
basta `fetch` normal, que o cookie viaja junto:

```ts
await fetch("/api/servicos", { method: "POST", body: JSON.stringify(dados) });
```

Papéis: `CLIENTE`, `DONO_SALAO`, `ADMIN`. O `ADMIN` passa em tudo que o dono faz.

## Formato de erro

Toda falha devolve o mesmo envelope:

```json
{ "erro": "Mensagem pronta para exibir", "codigo": "CONFLITO" }
```

Em erro de validação vem também `campos`, no formato que o formulário consome:

```json
{
  "erro": "Dados inválidos",
  "codigo": "VALIDACAO",
  "campos": { "nome": ["O nome do serviço deve ter ao menos 2 caracteres"] }
}
```

| HTTP | código | quando |
|---|---|---|
| 401 | `AUTENTICACAO` | sem sessão |
| 403 | `AUTORIZACAO` | papel errado (ex.: cliente tentando gerir salão) |
| 404 | `NAO_ENCONTRADO` | recurso inexistente ou de outro usuário |
| 409 | `CONFLITO` | regra de negócio violada (horário ocupado, fora do funcionamento…) |
| 422 | `VALIDACAO` | dados inválidos, com `campos` |
| 500 | `INTERNO` | erro inesperado |

A `mensagem` já vem escrita para o usuário final — dá para exibir direto.

---

## Serviços (#28 · RF20)

### `GET /api/servicos?salaoId=...` — público

```json
{ "servicos": [{ "id": "c...", "nome": "Corte masculino", "preco": 45, "duracaoMin": 30 }] }
```

### `GET /api/servicos` — dono logado

Sem `salaoId`, devolve os serviços do salão do próprio dono:

```json
{ "salaoId": "c...", "servicos": [ ... ] }
```

### `POST /api/servicos` — dono · 201

```json
{ "nome": "Hidratação", "preco": "120,50", "duracaoMin": 90 }
```

`preco` aceita número (`120.5`), string com vírgula (`"120,50"`) ou `null`/ausente
para "Consultar preço". `duracaoMin` vai de 5 a 600. Nome repetido no mesmo salão
dá 409.

Resposta: `{ "servico": { ... } }`

### `PATCH /api/servicos/[id]` — dono

Campos parciais; ao menos um. Mandar `"preco": null` zera o preço.

### `DELETE /api/servicos/[id]` — dono · 204

Serviço que já tem agendamento não pode ser excluído (409) — oriente a editar.

---

## Horários de funcionamento (#32 · RF22)

### `GET /api/horarios?salaoId=...` — público
### `GET /api/horarios` — dono logado

```json
{
  "salaoId": "c...",
  "horarios": [
    { "diaSemana": "SEG", "horaAbertura": "09:00", "horaFechamento": "18:00", "ativo": true }
  ]
}
```

Vem ordenado de domingo a sábado. Dias ausentes = salão fechado.

### `PUT /api/horarios` — dono

**É PUT: o corpo descreve a semana inteira.** Dia que não vier na lista é apagado.

```json
{
  "horarios": [
    { "diaSemana": "SEG", "horaAbertura": "09:00", "horaFechamento": "18:00" },
    { "diaSemana": "SAB", "horaAbertura": "09:00", "horaFechamento": "13:00", "ativo": false }
  ]
}
```

`diaSemana`: `DOM` `SEG` `TER` `QUA` `QUI` `SEX` `SAB`. `ativo` é opcional
(padrão `true`); `false` mantém o registro mas o dia não gera horários.

**"Replicar para os dias úteis" (RF22) é a tela que resolve** — monte as cinco
entradas iguais e mande tudo de uma vez.

Valida fechamento depois da abertura e dia repetido (422).

---

## Disponibilidade (#18 · RF15) — tela #19

### `GET /api/disponibilidade?salaoId=...&servicoId=...&data=2026-10-05` — público

```json
{
  "salaoId": "c...",
  "servicoId": "c...",
  "data": "2026-10-05",
  "funcionamento": { "horaAbertura": "09:00", "horaFechamento": "18:00" },
  "duracaoMin": 30,
  "slots": [
    { "hora": "09:00", "dataHora": "2026-10-05T12:00:00.000Z", "livre": true },
    { "hora": "10:00", "dataHora": "2026-10-05T13:00:00.000Z", "livre": false }
  ]
}
```

- `funcionamento: null` + `slots: []` → o salão não abre nesse dia. Mostre
  "fechado", não "sem horários".
- A grade é gerada em passos da duração do serviço, e o último slot só entra se
  o atendimento terminar antes de fechar. **Trocar de serviço muda a grade** —
  refaça a chamada.
- Horários ocupados vêm com `livre: false` em vez de sumirem: o RF15 pede que o
  ocupado apareça. Horário que já passou também vem `livre: false`.
- **A ocupação considera a duração inteira do atendimento, não só o início.**
  Um corte de 60 min às 10:00 deixa 10:30 indisponível para um serviço de 30
  min, porque o salão só vaga às 11:00. Encostar não conflita: um serviço que
  termina 10:00 convive com outro que começa 10:00.
- **Use o `dataHora` do slot no POST de agendamento**, sem remontar a data no
  cliente. Ele já está no fuso certo.

---

## Agendamentos (#20 e #38 · RF16, RF17, RF25)

### `POST /api/agendamentos` — cliente logado · 201 — tela #21

```json
{ "salaoId": "c...", "servicoId": "c...", "dataHora": "2026-10-05T12:00:00.000Z" }
```

Resposta:

```json
{
  "agendamento": {
    "id": "c...",
    "dataHora": "2026-10-05T12:00:00.000Z",
    "data": "2026-10-05",
    "hora": "09:00",
    "duracaoMin": 30,
    "status": "PENDENTE",
    "criadoEm": "2026-10-01T18:02:00.000Z",
    "salao":   { "id": "c...", "nome": "Salão da Márcia", "endereco": "...", "telefone": "..." },
    "servico": { "id": "c...", "nome": "Corte masculino", "preco": 45, "duracaoMin": 30 },
    "cliente": { "id": "c...", "nome": "Ana Souza", "telefone": "..." }
  }
}
```

`data` e `hora` já vêm convertidos para o fuso do salão — não refaça a conversão.
`duracaoMin` é a duração contratada no momento do agendamento; se o salão mudar a
duração do serviço depois, os agendamentos antigos mantêm a sua.

Conflitos possíveis (409), com mensagem pronta:

| Situação | Mensagem |
|---|---|
| horário ocupado (RGN02) | "Este horário acabou de ser ocupado. Escolha outro." |
| fora do funcionamento (RGN01) | "Horário fora do funcionamento do salão (09:00 às 18:00)" |
| salão fechado no dia | "O salão não abre neste dia" |
| fora da grade do serviço | "Horário fora da grade do serviço. O horário válido mais próximo é 10:00." |
| horário no passado | "Não é possível agendar em um horário que já passou" |

Trate o 409 de horário ocupado recarregando a disponibilidade: outra pessoa pode
ter agendado enquanto a tela estava aberta.

### `GET /api/agendamentos` — cliente logado

```json
{ "visao": "cliente", "agendamentos": [ ... ] }
```

Filtro opcional `?status=CONFIRMADO`. Ordena do mais recente para o mais antigo.

### `GET /api/agendamentos?visao=salao` — dono logado

```json
{ "visao": "salao", "salaoId": "c...", "agendamentos": [ ... ] }
```

Filtros: `?data=2026-10-05` (agenda do dia) e `?status=PENDENTE`. Ordena do mais
cedo para o mais tarde. Dono sem salão cadastrado recebe lista vazia, não erro.

### `GET /api/agendamentos/[id]` — cliente do agendamento, dono do salão ou admin

### `PATCH /api/agendamentos/[id]` — dono do salão (RGN07) — tela do salão

```json
{ "acao": "confirmar" }
```

| ação | sai de | vai para |
|---|---|---|
| `confirmar` | `PENDENTE` | `CONFIRMADO` |
| `recusar` | `PENDENTE`, `CONFIRMADO` | `CANCELADO` |
| `concluir` | `CONFIRMADO` | `CONCLUIDO` |

Transição inválida dá 409 com a mensagem explicando de quais status a ação vale.

---

## Status e ocupação da agenda

`PENDENTE` → `CONFIRMADO` → `CONCLUIDO`, com `CANCELADO` saindo de pendente ou
confirmado.

> **`PENDENTE` não está no PRD** (seção 5.5 lista só três status), mas o RF25
> exige que o salão "confirme ou recuse os agendamentos pendentes" — sem esse
> estado o requisito não existe. Recusa do salão e cancelamento do cliente caem
> os dois em `CANCELADO`.

**Só `CANCELADO` libera o horário.** `PENDENTE`, `CONFIRMADO` e `CONCLUIDO`
ocupam a agenda.

A garantia final é uma restrição `EXCLUDE` no Postgres sobre o intervalo
`dataHora → dataHora + duracaoMin`, por salão: nem em requisições simultâneas
duas pessoas conseguem agendar atendimentos que se cruzem. Verificado com 10
requisições concorrentes no mesmo horário — um 201 e nove 409.

## Fuso horário

O salão trabalha em UTC-3 (America/Fortaleza), fixo no backend. O banco guarda
instantes UTC; a API devolve `dataHora` em ISO/UTC **e** `data`/`hora` já no fuso
do salão. Prefira sempre os campos prontos — e, ao enviar, reaproveite o
`dataHora` que veio da disponibilidade.

## Ambiente de desenvolvimento

O cadastro de salão (RF03) é a issue #8 e ainda não existe, então use o seed:

```bash
npm run db:migrate
npm run db:seed
```

Cria o "Salão da Márcia" publicado, com 5 serviços (um sem preço, para testar a
RGN06) e horários de segunda a sábado. Contas:

| Papel | E-mail | Senha |
|---|---|---|
| Dono de salão | `dono@meusalao.dev` | `Senha123` |
| Cliente | `cliente@meusalao.dev` | `Senha123` |

## Ainda não implementado

Cancelamento pelo cliente (#24), listagem com filtros avançados (#10), perfil
público do salão (#14), cadastro de salão (#8), métricas do dashboard (#36).
