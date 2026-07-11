-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'closed');

-- Normalize any unexpected status values before casting
UPDATE "Ticket"
SET "status" = 'open'
WHERE "status" IS DISTINCT FROM 'open' AND "status" IS DISTINCT FROM 'closed';

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket"
  ALTER COLUMN "status" TYPE "TicketStatus"
  USING ("status"::"TicketStatus");
ALTER TABLE "Ticket"
  ALTER COLUMN "status" SET DEFAULT 'open'::"TicketStatus";
