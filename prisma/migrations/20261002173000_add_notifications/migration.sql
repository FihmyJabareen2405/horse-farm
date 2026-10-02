CREATE TYPE "NotificationType" AS ENUM (
  'LESSON_UPCOMING',
  'LESSON_CREATED',
  'LESSON_UPDATED',
  'LESSON_CANCELLED',
  'TREATMENT_DUE'
);

CREATE TABLE "Notification" (
  "id" SERIAL NOT NULL,
  "type" "NotificationType" NOT NULL,
  "titleHe" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "bodyHe" TEXT,
  "bodyAr" TEXT,
  "href" TEXT,
  "sourceKey" TEXT NOT NULL,
  "sourceVersion" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" INTEGER NOT NULL,
  "farmId" INTEGER NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_userId_type_sourceKey_key"
  ON "Notification"("userId", "type", "sourceKey");
CREATE INDEX "Notification_userId_readAt_createdAt_idx"
  ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_farmId_createdAt_idx"
  ON "Notification"("farmId", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmId_fkey"
  FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
