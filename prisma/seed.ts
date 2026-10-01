import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RODADAS_HASH = 10;

async function main() {
  const senhaHash = await bcrypt.hash("senha1234", RODADAS_HASH);

  const dono = await prisma.usuario.upsert({
    where: { email: "dono@meusalao.test" },
    update: {},
    create: {
      nome: "Dono de Teste",
      email: "dono@meusalao.test",
      senhaHash,
      papel: "DONO_SALAO",
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: "cliente@meusalao.test" },
    update: {},
    create: {
      nome: "Cliente de Teste",
      email: "cliente@meusalao.test",
      senhaHash,
      papel: "CLIENTE",
    },
  });

  console.log("Seed concluído:");
  console.log(`  Dono de salão   -> ${dono.email} / senha1234`);
  console.log(`  Cliente         -> ${cliente.email} / senha1234`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
