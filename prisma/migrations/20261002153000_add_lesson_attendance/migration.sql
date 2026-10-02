-- Instructor lesson follow-up: attendance and per-rider professional notes.
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('UNMARKED', 'PRESENT', 'ABSENT');

ALTER TABLE "public"."LessonParticipant"
  ADD COLUMN "attendance" "public"."AttendanceStatus" NOT NULL DEFAULT 'UNMARKED',
  ADD COLUMN "instructorNote" TEXT;
