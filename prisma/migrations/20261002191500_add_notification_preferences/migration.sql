CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "lessonUpcoming" BOOLEAN NOT NULL DEFAULT true,
    "lessonCreated" BOOLEAN NOT NULL DEFAULT true,
    "lessonUpdated" BOOLEAN NOT NULL DEFAULT true,
    "lessonCancelled" BOOLEAN NOT NULL DEFAULT true,
    "treatmentDue" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

ALTER TABLE "NotificationPreference"
ADD CONSTRAINT "NotificationPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
