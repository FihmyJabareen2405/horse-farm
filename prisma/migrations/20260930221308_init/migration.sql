-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Farm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Horse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATE,
    "breed" TEXT,
    "color" TEXT,
    "gender" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmId" INTEGER NOT NULL,

    CONSTRAINT "Horse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "level" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmId" INTEGER NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Instructor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "farmId" INTEGER NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Arena" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nameHe" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "farmId" INTEGER NOT NULL,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lesson" (
    "id" SERIAL NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "public"."LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "farmId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "arenaId" INTEGER NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LessonParticipant" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "riderId" INTEGER NOT NULL,
    "horseId" INTEGER NOT NULL,

    CONSTRAINT "LessonParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Treatment" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "performedAt" DATE NOT NULL,
    "nextDueAt" DATE,
    "provider" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horseId" INTEGER NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Horse_farmId_idx" ON "public"."Horse"("farmId");

-- CreateIndex
CREATE INDEX "Rider_farmId_idx" ON "public"."Rider"("farmId");

-- CreateIndex
CREATE INDEX "Instructor_farmId_idx" ON "public"."Instructor"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "Arena_farmId_code_key" ON "public"."Arena"("farmId", "code");

-- CreateIndex
CREATE INDEX "Lesson_farmId_startsAt_idx" ON "public"."Lesson"("farmId", "startsAt");

-- CreateIndex
CREATE INDEX "Lesson_arenaId_startsAt_idx" ON "public"."Lesson"("arenaId", "startsAt");

-- CreateIndex
CREATE INDEX "Lesson_instructorId_startsAt_idx" ON "public"."Lesson"("instructorId", "startsAt");

-- CreateIndex
CREATE INDEX "LessonParticipant_riderId_idx" ON "public"."LessonParticipant"("riderId");

-- CreateIndex
CREATE INDEX "LessonParticipant_horseId_idx" ON "public"."LessonParticipant"("horseId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonParticipant_lessonId_riderId_key" ON "public"."LessonParticipant"("lessonId", "riderId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonParticipant_lessonId_horseId_key" ON "public"."LessonParticipant"("lessonId", "horseId");

-- CreateIndex
CREATE INDEX "Treatment_horseId_performedAt_idx" ON "public"."Treatment"("horseId", "performedAt");

-- AddForeignKey
ALTER TABLE "public"."Horse" ADD CONSTRAINT "Horse_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rider" ADD CONSTRAINT "Rider_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Instructor" ADD CONSTRAINT "Instructor_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arena" ADD CONSTRAINT "Arena_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "public"."Arena"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonParticipant" ADD CONSTRAINT "LessonParticipant_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonParticipant" ADD CONSTRAINT "LessonParticipant_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonParticipant" ADD CONSTRAINT "LessonParticipant_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Treatment" ADD CONSTRAINT "Treatment_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Scheduling rules: preserved in migration history (not expressible in Prisma schema).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "public"."Lesson"
  ADD CONSTRAINT "Lesson_duration_30_minutes"
  CHECK ("endsAt" - "startsAt" = INTERVAL '30 minutes');

ALTER TABLE "public"."Lesson"
  ADD CONSTRAINT "Lesson_arena_no_overlap"
  EXCLUDE USING gist (
    "arenaId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" <> 'CANCELLED'::"public"."LessonStatus");

ALTER TABLE "public"."Lesson"
  ADD CONSTRAINT "Lesson_instructor_no_overlap"
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" <> 'CANCELLED'::"public"."LessonStatus");
