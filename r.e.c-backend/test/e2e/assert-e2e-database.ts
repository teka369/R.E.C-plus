/* eslint-disable prettier/prettier */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const DISPOSABLE_DB = /^recedu_e2e([_-][a-z0-9]+)?$/i;
const REMOTE_MARKERS = [
  'neon.tech',
  'render.com',
  'supabase.co',
  'amazonaws.com',
  'azure.com',
  'digitalocean.com',
  'heroku.com',
  'railway.app',
  'fly.io',
];

function validateE2eUrl(connectionString: string) {
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('DATABASE_URL es obligatorio para E2E.');
  }

  const lowered = connectionString.toLowerCase();
  const remote = REMOTE_MARKERS.find((marker) => lowered.includes(marker));
  if (remote) {
    throw new Error('Se rechazo el E2E: la URL apunta a un proveedor remoto (' + remote + ').');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('La URL de base de datos E2E no es válida.');
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
    throw new Error(
      'La URL de base de datos E2E debe usar el protocolo postgresql.',
    );
  }

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(
      `Se rechazó el E2E: el host "${host}" no es loopback. Usa una base local desechable.`,
    );
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, '')).split(
    '/',
  )[0];
  if (!DISPOSABLE_DB.test(database)) {
    throw new Error(
      `Se rechazó el E2E: la base debe llamarse recedu_e2e (recibido "${database}").`,
    );
  }

  const port = url.port || '5432';
  return { host, port, database };
}

export function assertE2eDatabase(input?: any, directUrl?: string): void {
  if (process.env.E2E_DATABASE !== '1') {
    throw new Error(
      'E2E_DATABASE=1 es obligatorio antes de crear o borrar datos E2E.',
    );
  }

  let databaseUrl: string | undefined;
  let directDatabaseUrl: string | undefined;

  if (typeof input === 'string' || input === undefined) {
    databaseUrl = (input as string) ?? process.env.DATABASE_URL;
    directDatabaseUrl = directUrl ?? process.env.DATABASE_DIRECT_URL;
  } else {
    const opts = input as { databaseUrl?: string; directUrl?: string };
    databaseUrl = opts.databaseUrl ?? process.env.DATABASE_URL;
    directDatabaseUrl = opts.directUrl ?? process.env.DATABASE_DIRECT_URL;
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatorio para E2E.');
  }
  if (!directDatabaseUrl) {
    throw new Error('DATABASE_DIRECT_URL es obligatorio para E2E.');
  }

  const runtime = validateE2eUrl(databaseUrl);
  const direct = validateE2eUrl(directDatabaseUrl);

  if (
    runtime.host !== direct.host ||
    runtime.port !== direct.port ||
    runtime.database !== direct.database
  ) {
    throw new Error(
      'DATABASE_URL y DATABASE_DIRECT_URL deben apuntar al mismo host, puerto y base de datos.',
    );
  }
}
