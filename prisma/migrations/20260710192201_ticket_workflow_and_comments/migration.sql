-- Soft-delete users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Ticket assignee + closedAt
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;

-- Replace cascade delete with restrict so tickets are preserved
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_userId_fkey";
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_assigneeId_fkey'
  ) THEN
    ALTER TABLE "Ticket"
      ADD CONSTRAINT "Ticket_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"("status");

-- Comments
CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Comment_ticketId_idx" ON "Comment"("ticketId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Comment_ticketId_fkey'
  ) THEN
    ALTER TABLE "Comment"
      ADD CONSTRAINT "Comment_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Comment_authorId_fkey'
  ) THEN
    ALTER TABLE "Comment"
      ADD CONSTRAINT "Comment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Activity log
CREATE TABLE IF NOT EXISTS "TicketActivity" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketActivity_actorId_idx" ON "TicketActivity"("actorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TicketActivity_ticketId_fkey'
  ) THEN
    ALTER TABLE "TicketActivity"
      ADD CONSTRAINT "TicketActivity_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TicketActivity_actorId_fkey'
  ) THEN
    ALTER TABLE "TicketActivity"
      ADD CONSTRAINT "TicketActivity_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
