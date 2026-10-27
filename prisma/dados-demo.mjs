/**
 * Dados de demonstração compartilhados pelos dois seeds (`seed.mjs`, para
 * desenvolvimento, e `seed-demo.mjs`, para o ambiente publicado).
 *
 * São três salões em bairros diferentes de Fortaleza, com coordenadas reais o
 * bastante para a ordenação por proximidade e o mapa fazerem sentido. Um deles
 * tem serviço sem preço, para exercitar a RGN06 ("Consultar preço").
 */

export const HORARIO_COMERCIAL = [
  { diaSemana: "SEG", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "TER", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "QUA", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "QUI", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "SEX", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { diaSemana: "SAB", horaAbertura: "09:00", horaFechamento: "13:00", ativo: true },
  { diaSemana: "DOM", horaAbertura: "09:00", horaFechamento: "13:00", ativo: false },
];

/** O primeiro salão é o do dono principal, usado nas telas de gestão. */
export const SALOES = [
  {
    dono: { nome: "Márcia Oliveira", email: "dono@meusalao.dev", telefone: "(85) 99999-0001" },
    salao: {
      nome: "Salão da Márcia",
      descricao: "Salão de bairro com atendimento personalizado há mais de 10 anos.",
      endereco: "Rua das Flores, 120 — Aldeota, Fortaleza/CE",
      telefone: "(85) 3333-0001",
      latitude: -3.7437,
      longitude: -38.4968,
      tipo: "Salão de bairro",
      publicado: true,
    },
    servicos: [
      { nome: "Corte feminino", preco: 80.0, duracaoMin: 60 },
      { nome: "Corte masculino", preco: 45.0, duracaoMin: 30 },
      { nome: "Manicure", preco: 40.0, duracaoMin: 45 },
      { nome: "Escova", preco: 70.0, duracaoMin: 60 },
      { nome: "Barba", preco: null, duracaoMin: 30 },
    ],
    horarios: HORARIO_COMERCIAL,
  },
  {
    dono: { nome: "Renata Alves", email: "renata@meusalao.dev", telefone: "(85) 99999-0003" },
    salao: {
      nome: "Studio Renata",
      descricao: "Especialista em coloração e tratamentos capilares.",
      endereco: "Av. Dom Luís, 500 — Meireles, Fortaleza/CE",
      telefone: "(85) 3333-0002",
      latitude: -3.7319,
      longitude: -38.5035,
      tipo: "Studio de beleza",
      publicado: true,
    },
    servicos: [
      { nome: "Corte feminino", preco: 110.0, duracaoMin: 60 },
      { nome: "Coloração", preco: 220.0, duracaoMin: 120 },
      { nome: "Hidratação", preco: 90.0, duracaoMin: 45 },
      { nome: "Escova", preco: 60.0, duracaoMin: 45 },
    ],
    horarios: HORARIO_COMERCIAL,
  },
  {
    dono: { nome: "Carlos Mendes", email: "carlos@meusalao.dev", telefone: "(85) 99999-0004" },
    salao: {
      nome: "Barba & Corte",
      descricao: "Barbearia clássica, com atendimento por ordem de chegada ou agendado.",
      endereco: "Rua Canuto de Aguiar, 88 — Papicu, Fortaleza/CE",
      telefone: "(85) 3333-0003",
      latitude: -3.7398,
      longitude: -38.4749,
      tipo: "Barbearia",
      publicado: true,
    },
    servicos: [
      { nome: "Corte masculino", preco: 40.0, duracaoMin: 30 },
      { nome: "Barba", preco: 35.0, duracaoMin: 30 },
      { nome: "Corte + barba", preco: 65.0, duracaoMin: 60 },
    ],
    horarios: HORARIO_COMERCIAL,
  },
];

export const CLIENTE = {
  nome: "Ana Souza",
  email: "cliente@meusalao.dev",
  telefone: "(85) 99999-0002",
};

/**
 * Conta administrativa (RF26). Sem ela o painel de administração fica
 * inalcançável: não há tela que promova alguém a ADMIN, justamente porque só um
 * ADMIN poderia usá-la.
 */
export const ADMIN = {
  nome: "Administração MeuSalão",
  email: "admin@meusalao.dev",
  telefone: null,
};
