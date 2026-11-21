import { assertE2eDatabase } from '../e2e/assert-e2e-database';

describe('assertE2eDatabase', () => {
  const previous = process.env.E2E_DATABASE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.E2E_DATABASE;
    } else {
      process.env.E2E_DATABASE = previous;
    }
  });

  it('rechaza una URL remota aunque el flag esté activo', () => {
    process.env.E2E_DATABASE = '1';
    expect(() =>
      assertE2eDatabase(
        'postgresql://postgres:postgres@ep-cool.neon.tech/recedu_e2e',
      ),
    ).toThrow(/proveedor remoto/);
  });

  it('rechaza un host que no es loopback', () => {
    process.env.E2E_DATABASE = '1';
    expect(() =>
      assertE2eDatabase('postgresql://postgres:postgres@db.internal/recedu_e2e'),
    ).toThrow(/no es loopback/);
  });

  it('rechaza una base local que no es la desechable', () => {
    process.env.E2E_DATABASE = '1';
    expect(() =>
      assertE2eDatabase('postgresql://postgres:postgres@127.0.0.1/recedu'),
    ).toThrow(/recedu_e2e/);
  });

  it('rechaza la base correcta si falta el flag', () => {
    delete process.env.E2E_DATABASE;
    expect(() =>
      assertE2eDatabase(
        'postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e',
      ),
    ).toThrow(/E2E_DATABASE=1/);
  });

  it('acepta loopback y el nombre desechable', () => {
    process.env.E2E_DATABASE = '1';
    expect(() =>
      assertE2eDatabase(
        'postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e?schema=public',
      ),
    ).not.toThrow();
  });
});
