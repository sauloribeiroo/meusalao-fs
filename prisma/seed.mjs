import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Dados de demonstração para desenvolvimento e apresentação.
 *
 * O cadastro de salão (RF03) é a issue #8 e ainda não existe, então não há como
 * criar um salão pela aplicação — sem este seed, as telas de serviços, horários
 * e agenda não teriam em que trabalhar. Quando a #8 entrar, o seed continua
 * útil, mas deixa de ser a única porta.
 *
 * Rodar com: npm run db:seed    (apaga e recria os dados de demonstração)
 */

const prisma = new PrismaClient();

const SENHA = "Senha123";
const EMAIL_DONO = "dono@meusalao.dev";
const EMAIL_CLIENTE = "cliente@meusalao.dev";

async function main() {
  const senhaHash = await bcrypt.hash(SENHA, 10);

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

  const cliente = await prisma.usuario.upsert({
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

  // Recria o salão do zero para o seed ser repetível.
  await prisma.salao.deleteMany({ where: { donoId: dono.id } });

  const salao = await prisma.salao.create({
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
      servicos: {
        create: [
          { nome: "Corte feminino", preco: 80.0, duracaoMin: 60 },
          { nome: "Corte masculino", preco: 45.0, duracaoMin: 30 },
          { nome: "Manicure", preco: 40.0, duracaoMin: 45 },
          { nome: "Escova", preco: 70.0, duracaoMin: 60 },
          // Sem preço de propósito: exercita a RGN06 ("Consultar preço").
          { nome: "Barba", preco: null, duracaoMin: 30 },
        ],
      },
      horarios: {
        create: [
          { diaSemana: "SEG", horaAbertura: "09:00", horaFechamento: "18:00" },
          { diaSemana: "TER", horaAbertura: "09:00", horaFechamento: "18:00" },
          { diaSemana: "QUA", horaAbertura: "09:00", horaFechamento: "18:00" },
          { diaSemana: "QUI", horaAbertura: "09:00", horaFechamento: "18:00" },
          { diaSemana: "SEX", horaAbertura: "09:00", horaFechamento: "18:00" },
          { diaSemana: "SAB", horaAbertura: "09:00", horaFechamento: "13:00" },
          { diaSemana: "DOM", horaAbertura: "09:00", horaFechamento: "13:00", ativo: false },
        ],
      },
    },
    include: { servicos: true },
  });

  console.log("Seed concluído.");
  console.log(`  Dono:    ${EMAIL_DONO} / ${SENHA}`);
  console.log(`  Cliente: ${EMAIL_CLIENTE} / ${SENHA}`);
  console.log(`  Salão:   ${salao.nome} (${salao.id})`);
  console.log(`  Serviços: ${salao.servicos.length} · Cliente de teste: ${cliente.nome}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
