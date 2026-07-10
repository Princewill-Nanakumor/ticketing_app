-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Seed admin so existing tickets can be owned
INSERT INTO "User" ("email", "name", "passwordHash", "role", "updatedAt")
VALUES (
  'admin@helix.local',
  'Helix Admin',
  '$2b$10$7hropEHx7.MUw1pu1LFox.nB5p5RrAVTZjIrAdIOoK9BXPNiHVTi2',
  'ADMIN',
  CURRENT_TIMESTAMP
);

-- AlterTable (nullable first, then backfill)
ALTER TABLE "Ticket" ADD COLUMN "userId" INTEGER;

UPDATE "Ticket"
SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'admin@helix.local')
WHERE "userId" IS NULL;

ALTER TABLE "Ticket" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
