-- CreateTable AuthSession for persistent refresh-token rotation and revocation
CREATE TABLE "AuthSession" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "jti" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "replacedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- Unique index for token identifier
CREATE UNIQUE INDEX "AuthSession_jti_key" ON "AuthSession"("jti");

-- Lookup performance for active sessions per user
CREATE INDEX "AuthSession_userId_revokedAt_expiresAt_idx"
  ON "AuthSession"("userId", "revokedAt", "expiresAt");

-- FK to User
ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Self-FK for rotation chain
ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_replacedById_fkey"
  FOREIGN KEY ("replacedById") REFERENCES "AuthSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
