import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ADMIN, CLIENTE, SALOES } from "./dados-demo.mjs";

/**
 * Dados de demonstração para desenvolvimento.
 *
 * O cadastro de salão (RF03) é a issue #8 e ainda não existe, então não há como
 * criar um salão pela aplicação — sem este seed, as telas de serviços, horários
 * e agenda não teriam em que trabalhar.
 *
 * Recria os salões do zero a cada execução, para o ambiente local ser sempre
 * previsível. Para semear o banco publicado, use `seed-demo.mjs`, que não apaga
 * nada.
 *
 * Rodar com: npm run db:seed
 */

const prisma = new PrismaClient();
const SENHA = "Senha123";

async function main() {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  const cliente = await prisma.usuario.upsert({
    where: { email: CLIENTE.email },
    update: { nome: CLIENTE.nome, telefone: CLIENTE.telefone, senhaHash, papel: "CLIENTE" },
    create: { ...CLIENTE, senhaHash, papel: "CLIENTE" },
  });

  await prisma.usuario.upsert({
    where: { email: ADMIN.email },
    update: { nome: ADMIN.nome, senhaHash, papel: "ADMIN" },
    create: { ...ADMIN, senhaHash, papel: "ADMIN" },
  });

  const criados = [];

  for (const { dono, salao, servicos, horarios } of SALOES) {
    const usuario = await prisma.usuario.upsert({
      where: { email: dono.email },
      update: { nome: dono.nome, telefone: dono.telefone, senhaHash, papel: "DONO_SALAO" },
      create: { ...dono, senhaHash, papel: "DONO_SALAO" },
    });

    await prisma.salao.deleteMany({ where: { donoId: usuario.id } });

    const registro = await prisma.salao.create({
      data: {
        donoId: usuario.id,
        ...salao,
        servicos: { create: servicos },
        horarios: { create: horarios },
      },
      include: { servicos: true },
    });

    criados.push({ nome: registro.nome, id: registro.id, servicos: registro.servicos.length, email: dono.email });
  }

  console.log("Seed concluído. Todas as contas usam a senha:", SENHA);
  console.log(`  Cliente: ${CLIENTE.email} (${cliente.nome})`);
  console.log(`  Admin:   ${ADMIN.email}`);
  for (const salao of criados) {
    console.log(`  Salão:   ${salao.nome.padEnd(16)} ${salao.servicos} serviços — dono ${salao.email}`);
  }
  console.log(`  O primeiro salão (${criados[0].nome}) é o das telas de gestão.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
