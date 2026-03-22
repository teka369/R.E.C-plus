import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL_TEST or DATABASE_URL must be set for integration tests',
  );
}

export const prismaTestClient = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
