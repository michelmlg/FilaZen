-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isIdle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "queueOriginalPosition" INTEGER;
