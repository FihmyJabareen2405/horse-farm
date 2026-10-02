CREATE TYPE "LessonAuditAction" AS ENUM ('CREATED', 'UPDATED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "LessonAudit" (
    "id" SERIAL NOT NULL,
    "action" "LessonAuditAction" NOT NULL,
    "descriptionHe" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lessonId" INTEGER NOT NULL,
    "actorUserId" INTEGER,
    CONSTRAINT "LessonAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonAudit_lessonId_createdAt_idx" ON "LessonAudit"("lessonId", "createdAt");
CREATE INDEX "LessonAudit_actorUserId_idx" ON "LessonAudit"("actorUserId");

ALTER TABLE "LessonAudit" ADD CONSTRAINT "LessonAudit_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonAudit" ADD CONSTRAINT "LessonAudit_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
