/**
 * Soft-delete helpers.
 * `findUnique` / `findUniqueOrThrow` cannot receive `deletedAt` in `where`:
 * Prisma rejects non-unique fields and that broke login (`user.findUnique({ email })`).
 * Those ops filter the result afterwards. List/count ops still inject `deletedAt: null`.
 */

export const SOFT_DELETE_UNIQUE_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
]);

export function hasExplicitDeletedAt(where: unknown): boolean {
  if (!where || typeof where !== 'object') return false;
  const obj = where as Record<string, unknown>;
  if ('deletedAt' in obj) return true;
  for (const key of ['AND', 'OR', 'NOT'] as const) {
    const nested = obj[key];
    if (Array.isArray(nested)) {
      if (nested.some((item) => hasExplicitDeletedAt(item))) return true;
    } else if (nested && typeof nested === 'object') {
      if (hasExplicitDeletedAt(nested)) return true;
    }
  }
  return false;
}

export function injectSoftDeleteWhere(
  op: string,
  args: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const safeArgs = { ...(args ?? {}) };
  if (SOFT_DELETE_UNIQUE_OPS.has(op)) {
    return safeArgs;
  }

  const where = {
    ...((safeArgs.where ?? {}) as Record<string, unknown>),
  };
  safeArgs.where = where;
  if (!hasExplicitDeletedAt(where)) {
    where.deletedAt = null;
  }
  return safeArgs;
}

export function prepareUniqueReadArgs(
  args: Record<string, unknown> | undefined,
): {
  args: Record<string, unknown>;
  injectedDeletedAt: boolean;
} {
  const safeArgs = { ...(args ?? {}) };
  if (!safeArgs.select || typeof safeArgs.select !== 'object') {
    return { args: safeArgs, injectedDeletedAt: false };
  }
  const select = { ...(safeArgs.select as Record<string, unknown>) };
  if ('deletedAt' in select) {
    return { args: safeArgs, injectedDeletedAt: false };
  }
  select.deletedAt = true;
  safeArgs.select = select;
  return { args: safeArgs, injectedDeletedAt: true };
}

export function concealSoftDeleted<T extends { deletedAt?: Date | null }>(
  op: string,
  record: T | null,
): T | null {
  if (!record || record.deletedAt == null) return record;
  if (!SOFT_DELETE_UNIQUE_OPS.has(op)) return record;
  if (op === 'findUniqueOrThrow') {
    const error = new Error('Record not found') as Error & { code?: string };
    error.code = 'P2025';
    throw error;
  }
  return null;
}

export function stripInjectedDeletedAt<T extends Record<string, unknown>>(
  record: T | null,
  injected: boolean,
): T | Omit<T, 'deletedAt'> | null {
  if (!record || !injected) return record;
  const rest = { ...record };
  delete rest.deletedAt;
  return rest;
}
