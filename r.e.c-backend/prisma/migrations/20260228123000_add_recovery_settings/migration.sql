-- CreateTable
CREATE TABLE "RecoveryConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoverySchedule" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileContent" BYTEA NOT NULL,
    "uploadedById" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoverySchedule_pkey" PRIMARY KEY ("id")
);
