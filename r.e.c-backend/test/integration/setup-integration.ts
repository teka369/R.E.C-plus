import { prismaTestClient } from '../helpers/prisma-test-client';
import { cleanTestDb } from '../helpers/db-cleanup';

beforeAll(async () => {
  await prismaTestClient.$connect();
  await cleanTestDb(prismaTestClient);
});

beforeEach(async () => {
  await cleanTestDb(prismaTestClient);
});

afterAll(async () => {
  await cleanTestDb(prismaTestClient);
  await prismaTestClient.$disconnect();
});
