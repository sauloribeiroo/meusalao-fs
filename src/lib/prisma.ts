import { PrismaClient } from "@prisma/client";

// Em dev, o hot reload recria módulos: guardamos o client no global para não
// abrir uma conexão nova a cada recarga.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
