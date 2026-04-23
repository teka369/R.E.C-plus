/**
 * Ventana de recuperaciones: activa si `now` está entre startAt y endAt (inclusive).
 * Fuente única de verdad compartida con RecoveryService y RecoverySettingsService.
 */
export function isRecoveryWindowActive(
  startAt: Date,
  endAt: Date,
  nowMs: number = Date.now(),
): boolean {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return nowMs >= start && nowMs <= end;
}
