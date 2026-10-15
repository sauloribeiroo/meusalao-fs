-- CreateTable
CREATE TABLE "tokens_senha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_senha_tokenHash_key" ON "tokens_senha"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_senha_usuarioId_idx" ON "tokens_senha"("usuarioId");

-- AddForeignKey
ALTER TABLE "tokens_senha" ADD CONSTRAINT "tokens_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
