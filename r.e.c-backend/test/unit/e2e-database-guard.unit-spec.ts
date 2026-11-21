import { assertE2eDatabase } from '../e2e/assert-e2e-database';

describe('assertE2eDatabase', () => {
  const previousFlag = process.env.E2E_DATABASE;
  const previousUrl = process.env.DATABASE_URL;
  const previousDirect = process.env.DATABASE_DIRECT_URL;

  afterEach(() => {
    if (previousFlag === undefined) delete process.env.E2E_DATABASE;
    else process.env.E2E_DATABASE = previousFlag;
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    if (previousDirect === undefined) delete process.env.DATABASE_DIRECT_URL;
    else process.env.DATABASE_DIRECT_URL = previousDirect;
  });

  const localRuntime =
    'postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e?schema=public';
  const localDirect =
    'postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e';

  it('rechaza una URL runtime remota aunque el flag esté activo', () => {
    process.env.E2E_DATABASE = '1';
    const remote = 'postgresql://postgres:postgres@ep-cool.neon.tech/recedu_e2e';
    expect(() => assertE2eDatabase(remote)).toThrow(/proveedor remoto/);
  });

  it('rechaza una URL directa remota aunque la runtime sea local', () => {
    process.env.E2E_DATABASE = '1';
    const direct = 'postgresql://postgres:postgres@db.internal/recedu_e2e';
    expect(() => assertE2eDatabase(localRuntime, direct)).toThrow(
      /no es loopback|proveedor remoto/,
    );
  });

  it('rechaza una URL directa con otra base de datos', () => {
    process.env.E2E_DATABASE = '1';
    const direct = 'postgresql://postgres:postgres@127.0.0.1:5432/otra_base';
    expect(() => assertE2eDatabase(localRuntime, direct)).toThrow(
      /recedu_e2e|host, puerto y base/,
    );
  });

  it('rechaza un host que no es loopback', () => {
    process.env.E2E_DATABASE = '1';
    const url = 'postgresql://postgres:postgres@db.internal/recedu_e2e';
    expect(() => assertE2eDatabase(url)).toThrow(/no es loopback/);
  });

  it('rechaza una URL malformada', () => {
    process.env.E2E_DATABASE = '1';
    expect(() => assertE2eDatabase('no-es-url')).toThrow(/no es válida/);
  });

  it('rechaza la base correcta si falta el flag', () => {
    delete process.env.E2E_DATABASE;
    expect(() => assertE2eDatabase(localRuntime, localDirect)).toThrow(
      /E2E_DATABASE=1/,
    );
  });

  it('rechaza si falta DATABASE_DIRECT_URL', () => {
    process.env.E2E_DATABASE = '1';
    delete process.env.DATABASE_DIRECT_URL;
    expect(() => assertE2eDatabase(localRuntime)).toThrow(
      /DATABASE_DIRECT_URL/,
    );
  });

  it('rechaza si runtime y direct apuntan a bases distintas', () => {
    process.env.E2E_DATABASE = '1';
    const direct =
      'postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e_extra';
    expect(() => assertE2eDatabase(localRuntime, direct)).toThrow(
      /host, puerto y base/,
    );
  });

  it('acepta dos URLs locales válidas para la misma base', () => {
    process.env.E2E_DATABASE = '1';
    expect(() => assertE2eDatabase(localRuntime, localDirect)).not.toThrow();
  });

  it('acepta la forma de objeto', () => {
    process.env.E2E_DATABASE = '1';
    expect(() =>
      assertE2eDatabase({ databaseUrl: localRuntime, directUrl: localDirect }),
    ).not.toThrow();
  });

  it('acepta cuando ambas vienen por entorno', () => {
    process.env.E2E_DATABASE = '1';
    process.env.DATABASE_URL = localRuntime;
    process.env.DATABASE_DIRECT_URL = localDirect;
    expect(() => assertE2eDatabase()).not.toThrow();
  });
});
