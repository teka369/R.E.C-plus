-- Indexes enfocados en multi-tenant, consultas por periodos y paneles de alto trafico
CREATE INDEX IF NOT EXISTS idx_user_institution_role ON "User" ("institutionId", "role");
CREATE INDEX IF NOT EXISTS idx_group_institution_grade ON "Group" ("institutionId", "gradeId");
CREATE INDEX IF NOT EXISTS idx_studentgroup_student_period ON "StudentGroup" ("studentId", "academicPeriodId", "status");
CREATE INDEX IF NOT EXISTS idx_studentgroup_group_period ON "StudentGroup" ("groupId", "academicPeriodId", "status");
CREATE INDEX IF NOT EXISTS idx_teacherassignment_teacher_group ON "TeacherAssignment" ("teacherId", "groupId");
CREATE INDEX IF NOT EXISTS idx_offering_group_period_active ON "AcademicOffering" ("groupId", "academicPeriodId", "isActive");
CREATE INDEX IF NOT EXISTS idx_recoveryrequest_group_status ON "RecoveryRequest" ("groupId", "status", "requestedAt");
CREATE INDEX IF NOT EXISTS idx_recoveryrequest_student_status ON "RecoveryRequest" ("studentId", "status");
CREATE INDEX IF NOT EXISTS idx_studymaterial_group_subject_created ON "StudyMaterial" ("groupId", "subjectId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON "Notification" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_message_recipient_created ON "Message" ("recipientId", "createdAt" DESC);
