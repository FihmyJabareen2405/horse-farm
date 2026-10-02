ALTER TABLE "LessonParticipant"
ADD COLUMN "progressScore" INTEGER;

ALTER TABLE "LessonParticipant"
ADD CONSTRAINT "LessonParticipant_progressScore_check"
CHECK ("progressScore" IS NULL OR ("progressScore" >= 1 AND "progressScore" <= 5));
