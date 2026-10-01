-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB');

-- CreateTable
CREATE TABLE "saloes" (
    "id" TEXT NOT NULL,
    "donoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "tipo" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saloes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "salaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DECIMAL(10,2),
    "duracaoMin" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_funcionamento" (
    "id" TEXT NOT NULL,
    "salaoId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaAbertura" TEXT NOT NULL,
    "horaFechamento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "salaoId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "salaoId" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saloes_donoId_idx" ON "saloes"("donoId");

-- CreateIndex
CREATE INDEX "saloes_publicado_idx" ON "saloes"("publicado");

-- CreateIndex
CREATE INDEX "servicos_salaoId_idx" ON "servicos"("salaoId");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_funcionamento_salaoId_diaSemana_key" ON "horarios_funcionamento"("salaoId", "diaSemana");

-- CreateIndex
CREATE INDEX "agendamentos_clienteId_dataHora_idx" ON "agendamentos"("clienteId", "dataHora");

-- CreateIndex
CREATE INDEX "agendamentos_salaoId_dataHora_idx" ON "agendamentos"("salaoId", "dataHora");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_agendamentoId_key" ON "avaliacoes"("agendamentoId");

-- CreateIndex
CREATE INDEX "avaliacoes_salaoId_idx" ON "avaliacoes"("salaoId");

-- AddForeignKey
ALTER TABLE "saloes" ADD CONSTRAINT "saloes_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_salaoId_fkey" FOREIGN KEY ("salaoId") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RGN02: um horario ocupado fica indisponivel para outros clientes no mesmo salao.
-- Indice PARCIAL, escrito a mao porque o Prisma nao expressa a clausula WHERE no schema.
-- O PRD sugere @@unique([salaoId, dataHora]) puro, mas isso manteria o horario
-- bloqueado para sempre depois de um cancelamento: a linha cancelada continuaria
-- ocupando a chave. So o cancelamento devolve o horario -- um atendimento concluido
-- aconteceu naquele horario e nao pode ser revendido.
CREATE UNIQUE INDEX "agendamentos_salao_datahora_ocupado_key"
    ON "agendamentos"("salaoId", "dataHora")
    WHERE "status" <> 'CANCELADO';
