/**
 * FASE 2C – Script de verificación de integridad tenant en modelos hoja
 *
 * Ejecutar ANTES de aplicar la migración de constraints.
 * Detecta filas cuyo groupId apunta a un grupo de una institución diferente
 * a la del teacher/student involucrado (cross-tenant contaminación).
 *
 * Uso:
 *   cd r.e.c-backend
 *   node scripts/verify-tenant-leaf-integrity.js
 *
 * Salida:
 *   - "✅ OK" si no hay filas huérfanas
 *   - Lista de IDs problemáticos si los hay (tratar manualmente antes de migrar)
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let totalIssues = 0;

  // ── 1. Feedback: teacher y student deben ser de la misma institución que el grupo ──
  const feedbackIssues = await prisma.$queryRaw`
    SELECT f.id,
           f."teacherId",
           f."studentId",
           f."groupId",
           g."institutionId" AS "groupInstitution",
           ut."institutionId" AS "teacherInstitution",
           us."institutionId" AS "studentInstitution"
    FROM "Feedback" f
    JOIN "Group"  g  ON g.id = f."groupId"
    JOIN "User"   ut ON ut.id = f."teacherId"
    JOIN "User"   us ON us.id = f."studentId"
    WHERE ut."institutionId" IS DISTINCT FROM g."institutionId"
       OR us."institutionId" IS DISTINCT FROM g."institutionId"
    ORDER BY f.id
  `;
  report('Feedback', feedbackIssues);
  totalIssues += feedbackIssues.length;

  // ── 2. StudyMaterial: teacher debe ser de la misma institución que el grupo ──
  const materialIssues = await prisma.$queryRaw`
    SELECT sm.id,
           sm."teacherId",
           sm."groupId",
           g."institutionId" AS "groupInstitution",
           u."institutionId"  AS "teacherInstitution"
    FROM "StudyMaterial" sm
    JOIN "Group" g ON g.id = sm."groupId"
    JOIN "User"  u ON u.id = sm."teacherId"
    WHERE u."institutionId" IS DISTINCT FROM g."institutionId"
    ORDER BY sm.id
  `;
  report('StudyMaterial', materialIssues);
  totalIssues += materialIssues.length;

  // ── 3. RecoveryRequest: teacher y student deben coincidir con institución del grupo ──
  const recoveryIssues = await prisma.$queryRaw`
    SELECT rr.id,
           rr."studentId",
           rr."teacherId",
           rr."groupId",
           g."institutionId"  AS "groupInstitution",
           ut."institutionId" AS "teacherInstitution",
           us."institutionId" AS "studentInstitution"
    FROM "RecoveryRequest" rr
    JOIN "Group" g  ON g.id  = rr."groupId"
    JOIN "User"  ut ON ut.id = rr."teacherId"
    JOIN "User"  us ON us.id = rr."studentId"
    WHERE ut."institutionId" IS DISTINCT FROM g."institutionId"
       OR us."institutionId" IS DISTINCT FROM g."institutionId"
    ORDER BY rr.id
  `;
  report('RecoveryRequest', recoveryIssues);
  totalIssues += recoveryIssues.length;

  // ── 4. WeeklyScheduleEntry: teacher debe coincidir con institución del grupo ──
  const scheduleIssues = await prisma.$queryRaw`
    SELECT wse.id,
           wse."teacherId",
           wse."groupId",
           g."institutionId" AS "groupInstitution",
           u."institutionId"  AS "teacherInstitution"
    FROM "WeeklyScheduleEntry" wse
    JOIN "Group" g ON g.id = wse."groupId"
    JOIN "User"  u ON u.id = wse."teacherId"
    WHERE u."institutionId" IS DISTINCT FROM g."institutionId"
    ORDER BY wse.id
  `;
  report('WeeklyScheduleEntry', scheduleIssues);
  totalIssues += scheduleIssues.length;

  // ── 5. Notification: usuario debe tener institutionId (no nulo para usuarios tenant) ──
  const notifIssues = await prisma.$queryRaw`
    SELECT n.id, n."userId", u."institutionId", u.role
    FROM "Notification" n
    JOIN "User" u ON u.id = n."userId"
    WHERE u."institutionId" IS NULL AND u.role != 'SUPER_ADMIN'
    ORDER BY n.id
  `;
  report('Notification (usuario sin institución)', notifIssues);
  totalIssues += notifIssues.length;

  // ── Resultado final ──────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  if (totalIssues === 0) {
    console.log('✅  INTEGRIDAD TENANT OK — Puede proceder con la migración.');
  } else {
    console.log(
      `⛔  SE ENCONTRARON ${totalIssues} FILAS CON PROBLEMAS.\n` +
      '    Resuelva manualmente antes de aplicar la migración de constraints.',
    );
    process.exit(1);
  }
}

function report(model, rows) {
  if (rows.length === 0) {
    console.log(`✅  ${model}: sin problemas`);
  } else {
    console.log(`⛔  ${model}: ${rows.length} fila(s) con datos cross-tenant`);
    console.table(rows);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
