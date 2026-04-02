-- CreateIndex
CREATE INDEX "Feedback_studentId_createdAt_idx" ON "Feedback"("studentId", "createdAt" DESC);
