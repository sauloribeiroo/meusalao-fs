-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('CLIENTE', 'DONO_SALAO', 'ADMIN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senhaHash" TEXT,
    "papel" "Papel" NOT NULL DEFAULT 'CLIENTE',
    "imagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "idNoProvedor" TEXT NOT NULL,

    CONSTRAINT "contas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contas_provedor_idNoProvedor_key" ON "contas"("provedor", "idNoProvedor");

-- AddForeignKey
ALTER TABLE "contas" ADD CONSTRAINT "contas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
