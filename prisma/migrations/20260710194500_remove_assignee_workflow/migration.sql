-- Remove assignee workflow
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_assigneeId_fkey";
DROP INDEX IF EXISTS "Ticket_assigneeId_idx";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "assigneeId";

-- Collapse intermediate workflow statuses back to open
UPDATE "Ticket"
SET "status" = 'open'
WHERE "status" IN ('in_progress', 'pending');
