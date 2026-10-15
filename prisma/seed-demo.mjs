import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLIENTE, SALOES } from "./dados-demo.mjs";

/**
 * Semeia dados de demonstração em um banco REMOTO (ex.: o Neon de produção),
 * para apresentar a aplicação publicada enquanto o cadastro de salão (RF03,
 * issue #8) não existe.
 *
 * Diferente de `prisma/seed.mjs`, que é para a máquina do desenvolvedor:
 *
 *  - não lê DATABASE_URL do .env: a URL vem de URL_BANCO_DEMO, para não haver
 *    chance de acertar o banco errado por um .env esquecido;
 *  - exige CONFIRMA_SEED=sim, para não rodar sem intenção;
 *  - exige SENHA_DEMO, porque as contas ficam acessíveis em um site público;
 *  - não apaga nada. Rodar duas vezes não duplica dados nem derruba
 *    agendamentos já feitos.
 *
 * Uso (PowerShell):
 *
 *   $env:URL_BANCO_DEMO = "postgresql://...neon.tech/...?sslmode=require"
 *   $env:SENHA_DEMO     = "uma-senha-sua"
 *   $env:CONFIRMA_SEED  = "sim"
 *   node prisma/seed-demo.mjs
 *   Remove-Item Env:URL_BANCO_DEMO, Env:SENHA_DEMO, Env:CONFIRMA_SEED
 */

const url = process.env.URL_BANCO_DEMO;
const senha = process.env.SENHA_DEMO;

if (!url) {
  console.error("Defina URL_BANCO_DEMO com a connection string do banco alvo.");
  process.exit(1);
}
if (!senha || senha.length < 8) {
  console.error("Defina SENHA_DEMO com ao menos 8 caracteres (letras e números).");
  process.exit(1);
}
if (process.env.CONFIRMA_SEED !== "sim") {
  console.error(`Alvo: ${new URL(url).host}`);
  console.error("Confirme com CONFIRMA_SEED=sim antes de rodar.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: url });

async function main() {
  console.log(`Alvo: ${new URL(url).host}`);
  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.usuario.upsert({
    where: { email: CLIENTE.email },
    update: { senhaHash },
    create: { ...CLIENTE, senhaHash, papel: "CLIENTE" },
  });

  const resumo = [];

  for (const { dono, salao: dados, servicos, horarios } of SALOES) {
    const usuario = await prisma.usuario.upsert({
      where: { email: dono.email },
      update: { papel: "DONO_SALAO", senhaHash },
      create: { ...dono, senhaHash, papel: "DONO_SALAO" },
    });

    // Reaproveita o salão que já existir deste dono, em vez de recriar: assim
    // rodar de novo não derruba agendamentos nem edições feitas na aplicação.
    const existente = await prisma.salao.findFirst({ where: { donoId: usuario.id }, select: { id: true } });

    const salao = existente
      ? await prisma.salao.update({ where: { id: existente.id }, data: { publicado: true } })
      : await prisma.salao.create({ data: { donoId: usuario.id, ...dados } });

    let criados = 0;
    for (const servico of servicos) {
      const ja = await prisma.servico.findFirst({
        where: { salaoId: salao.id, nome: servico.nome },
        select: { id: true },
      });
      if (ja) continue;

      await prisma.servico.create({ data: { salaoId: salao.id, ...servico } });
      criados += 1;
    }

    for (const horario of horarios) {
      await prisma.horarioFuncionamento.upsert({
        where: { salaoId_diaSemana: { salaoId: salao.id, diaSemana: horario.diaSemana } },
        update: {
          horaAbertura: horario.horaAbertura,
          horaFechamento: horario.horaFechamento,
          ativo: horario.ativo,
        },
        create: { salaoId: salao.id, ...horario },
      });
    }

    const total = await prisma.servico.count({ where: { salaoId: salao.id } });
    resumo.push({ nome: salao.nome, email: dono.email, total, criados });
  }

  console.log("Seed de demonstração concluído.");
  for (const salao of resumo) {
    console.log(`  ${salao.nome.padEnd(16)} ${salao.total} serviços (${salao.criados} criados agora) — dono ${salao.email}`);
  }
  console.log(`  Cliente: ${CLIENTE.email}`);
  console.log("  Todas as contas usam a senha informada em SENHA_DEMO.");
}


main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
