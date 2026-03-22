/* Minimal Prisma mock factory for unit tests focused on tenant boundaries. */
export function createPrismaMock() {
  return {
    institution: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    academicPeriod: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    grade: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    group: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    studentGroup: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    recoveryRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    recoveryActivity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    recoveryMessage: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    feedback: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    evaluationGrade: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      upsert: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(undefined)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
