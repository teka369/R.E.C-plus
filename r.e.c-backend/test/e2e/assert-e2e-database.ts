/**
 * Impide que un seed o un E2E escriba en una base real o remota.
 * Exige un flag explícito, host loopback y un nombre de base desechable.
 */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const DISPOSABLE_DB = /^recedu_e2e([_-][a-z0-9]+)?$/i;
const REMOTE_MARKERS = [
  'neon.tech',
  'render.com',
  'supabase.co',
  'amazonaws.com',
  'azure.com',
  'digitalocean.com',
];

export function assertE2eDatabase(
  connectionString = process.env.DATABASE_URL,
): void {
  if (process.env.E2E_DATABASE !== '1') {
    throw new Error(
      'E2E_DATABASE=1 es obligatorio antes de crear o borrar datos E2E.',
    );
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL es obligatorio para E2E.');
  }

  const lowered = connectionString.toLowerCase();
  const remote = REMOTE_MARKERS.find((marker) => lowered.includes(marker));
  if (remote) {
    throw new Error(
      `Se rechazó el E2E: la URL apunta a un proveedor remoto (${remote}).`,
    );
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL no es una URL válida.');
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
      `Se rechazó el E2E: la base "${database}" debe llamarse recedu_e2e.`,
    );
  }
}
