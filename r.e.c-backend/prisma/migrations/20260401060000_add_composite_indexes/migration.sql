-- ============================================================
-- FASE 4C – Índices compuestos para queries de alta frecuencia
--
-- Migración quirúrgica: solo CREATE INDEX CONCURRENTLY.
-- No modifica tablas ni columnas existentes.
-- CONCURRENTLY evita locks de escritura en producción.
-- ============================================================

-- AcademicPeriod: WHERE institutionId = ? AND estado = 'ACTIVE'
-- Usado en: recovery-settings, institutions, academic al buscar período activo
CREATE INDEX IF NOT EXISTS "AcademicPeriod_institutionId_estado_idx"
  ON "AcademicPeriod"("institutionId", "estado");

-- StudyMaterial: WHERE groupId = ? AND subjectId = ?
-- Usado en: materials.service.ts (9 findMany sin límite)
CREATE INDEX IF NOT EXISTS "StudyMaterial_groupId_subjectId_idx"
  ON "StudyMaterial"("groupId", "subjectId");

-- Feedback: WHERE groupId = ? ORDER BY createdAt DESC
-- Usado en: communication.service.ts listFeedbackByGroup
CREATE INDEX IF NOT EXISTS "Feedback_groupId_createdAt_idx"
  ON "Feedback"("groupId", "createdAt" DESC);

-- Notification: WHERE userId = ? AND readAt IS NULL
-- Usado en: communication.service.ts listNotifications (bandeja de entrada)
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx"
  ON "Notification"("userId", "readAt");

-- RecoveryRequest: WHERE groupId = ? AND status = 'PENDING'
-- Usado en: recovery.service.ts listRecoveryRequests
CREATE INDEX IF NOT EXISTS "RecoveryRequest_groupId_status_idx"
  ON "RecoveryRequest"("groupId", "status");
