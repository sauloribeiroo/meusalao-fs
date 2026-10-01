-- Impede agendamentos sobrepostos no mesmo salao (RGN02).
--
-- O indice unico anterior comparava apenas (salaoId, dataHora), ou seja, so o
-- INICIO do atendimento. Um corte de 60 min as 10:00 nao impedia outro de 30 min
-- as 10:30, com o salao ocupado ate as 11:00. A correcao guarda a duracao na
-- propria linha e troca o indice por uma restricao EXCLUDE sobre o intervalo.

-- 1. Duracao do atendimento na linha do agendamento.
--    Entra como nula, e preenchida a partir do servico e so entao vira NOT NULL,
--    para a migracao rodar tambem em banco que ja tenha agendamentos.
ALTER TABLE "agendamentos" ADD COLUMN "duracaoMin" INTEGER;

UPDATE "agendamentos" AS a
   SET "duracaoMin" = s."duracaoMin"
  FROM "servicos" AS s
 WHERE s."id" = a."servicoId";

-- Rede de seguranca: agendamento cujo servico tenha sumido fica com 30 min.
UPDATE "agendamentos" SET "duracaoMin" = 30 WHERE "duracaoMin" IS NULL;

ALTER TABLE "agendamentos" ALTER COLUMN "duracaoMin" SET NOT NULL;

-- 2. Restricao de sobreposicao. Precisa do btree_gist para combinar igualdade
--    (salaoId) com sobreposicao de intervalo (&&) no mesmo indice GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP INDEX IF EXISTS "agendamentos_salao_datahora_ocupado_key";

ALTER TABLE "agendamentos"
  ADD CONSTRAINT "agendamentos_sem_sobreposicao"
  EXCLUDE USING gist (
    "salaoId" WITH =,
    tsrange("dataHora", "dataHora" + ("duracaoMin" * INTERVAL '1 minute')) WITH &&
  )
  WHERE ("status" <> 'CANCELADO');
