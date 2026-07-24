-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "sendDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "sendEndHour" INTEGER,
ADD COLUMN     "sendJitterMinutes" INTEGER,
ADD COLUMN     "sendStartHour" INTEGER,
ADD COLUMN     "sendTimezone" TEXT,
ADD COLUMN     "sendWindowEnabled" BOOLEAN;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "sendDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "sendEndHour" INTEGER NOT NULL DEFAULT 17,
ADD COLUMN     "sendJitterMinutes" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "sendStartHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "sendTimezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "sendWindowEnabled" BOOLEAN NOT NULL DEFAULT true;

