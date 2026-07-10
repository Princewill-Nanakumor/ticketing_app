-- Drop FK so we can change id types
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_userId_fkey";

-- Clear existing rows (Int user ids cannot map cleanly to cuid)
TRUNCATE TABLE "Ticket" RESTART IDENTITY;
TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;

-- Convert User.id from integer to cuid text
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "User_id_seq";
ALTER TABLE "User" ALTER COLUMN "id" TYPE TEXT USING (id::text);
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Convert Ticket.userId to text
ALTER TABLE "Ticket" ALTER COLUMN "userId" TYPE TEXT USING ("userId"::text);

-- Restore FK
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
