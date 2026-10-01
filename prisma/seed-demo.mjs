import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

const EMAIL_DONO = "dono@meusalao.dev";
const EMAIL_CLIENTE = "cliente@meusalao.dev";

const SERVICOS = [
  { nome: "Corte feminino", preco: 80.0, duracaoMin: 60 },
  { nome: "Corte masculino", preco: 45.0, duracaoMin: 30 },
  { nome: "Manicure", preco: 40.0, duracaoMin: 45 },
  { nome: "Escova", preco: 70.0, duracaoMin: 60 },
  // Sem preço de propósito: exercita a RGN06 ("Consultar preço").
  { nome: "Barba", preco: null, duracaoMin: 30 },
];

const HORARIOS = [
  { diaSemana: "SEG", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "TER", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "QUA", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "QUI", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "SEX", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "SAB", horaAbertura: "09:00", horaFechamento: "13:00", ativo: true },
  { diaSemana: "DOM", horaAbertura: "09:00", horaFechamento: "13:00", ativo: false },
];

async function main() {
  console.log(`Alvo: ${new URL(url).host}`);
  const senhaHash = await bcrypt.hash(senha, 10);

  const dono = await prisma.usuario.upsert({
    where: { email: EMAIL_DONO },
    update: { papel: "DONO_SALAO", senhaHash },
    create: {
      nome: "Márcia Oliveira",
      email: EMAIL_DONO,
      telefone: "(85) 99999-0001",
      senhaHash,
      papel: "DONO_SALAO",
    },
  });

  await prisma.usuario.upsert({
    where: { email: EMAIL_CLIENTE },
    update: { senhaHash },
    create: {
      nome: "Ana Souza",
      email: EMAIL_CLIENTE,
      telefone: "(85) 99999-0002",
      senhaHash,
      papel: "CLIENTE",
    },
  });

  // Reaproveita o salão que já existir deste dono, em vez de recriar.
  const existente = await prisma.salao.findFirst({ where: { donoId: dono.id }, select: { id: true } });

  const salao = existente
    ? await prisma.salao.update({ where: { id: existente.id }, data: { publicado: true } })
    : await prisma.salao.create({
        data: {
          donoId: dono.id,
          nome: "Salão da Márcia",
          descricao: "Salão de bairro com atendimento personalizado há mais de 10 anos.",
          endereco: "Rua das Flores, 120 — Aldeota, Fortaleza/CE",
          telefone: "(85) 3333-0001",
          latitude: -3.7437,
          longitude: -38.4968,
          tipo: "Salão de bairro",
          publicado: true,
        },
      });

  let criados = 0;
  for (const servico of SERVICOS) {
    const ja = await prisma.servico.findFirst({
      where: { salaoId: salao.id, nome: servico.nome },
      select: { id: true },
    });
    if (ja) continue;

    await prisma.servico.create({ data: { salaoId: salao.id, ...servico } });
    criados += 1;
  }

  for (const horario of HORARIOS) {
    await prisma.horarioFuncionamento.upsert({
      where: { salaoId_diaSemana: { salaoId: salao.id, diaSemana: horario.diaSemana } },
      update: { horaAbertura: horario.horaAbertura, horaFechamento: horario.horaFechamento, ativo: horario.ativo },
      create: { salaoId: salao.id, ...horario },
    });
  }

  const totalServicos = await prisma.servico.count({ where: { salaoId: salao.id } });

  console.log("Seed de demonstração concluído.");
  console.log(`  Salão:    ${salao.nome} (${salao.id}) — publicado`);
  console.log(`  Serviços: ${totalServicos} no total, ${criados} criados agora`);
  console.log(`  Contas:   ${EMAIL_DONO} e ${EMAIL_CLIENTE}, com a senha informada`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
