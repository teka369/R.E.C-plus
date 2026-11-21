import { assertE2eDatabase } from './assert-e2e-database';

try {
  assertE2eDatabase();
  console.log('Guardia E2E: DATABASE_URL y DATABASE_DIRECT_URL validadas.');
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
