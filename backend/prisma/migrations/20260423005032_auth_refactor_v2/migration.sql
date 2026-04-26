/*
  Warnings:

  - You are about to drop the column `userId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `isIdle` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastQueuePing` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `queueEnteredAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `queueOriginalPosition` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `queuePosition` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `skippedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `wasSkipped` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_statusId_fkey";

-- AlterTable
ALTER TABLE "tenant_users" ADD COLUMN     "statusId" TEXT;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "userId",
ADD COLUMN     "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isIdle",
DROP COLUMN "lastQueuePing",
DROP COLUMN "queueEnteredAt",
DROP COLUMN "queueOriginalPosition",
DROP COLUMN "queuePosition",
DROP COLUMN "skippedAt",
DROP COLUMN "statusId",
DROP COLUMN "wasSkipped";

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "position" INTEGER,
    "enteredAt" TIMESTAMP(3),
    "originalPosition" INTEGER,
    "wasSkipped" BOOLEAN NOT NULL DEFAULT false,
    "skippedAt" TIMESTAMP(3),
    "isIdle" BOOLEAN NOT NULL DEFAULT false,
    "lastPing" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_tenantUserId_key" ON "queue_entries"("tenantUserId");

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "user_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_tenant_user_fk" FOREIGN KEY ("tenantUserId") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
