-- Expand ticket statuses (idempotent for Neon / re-runs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'TicketStatus' AND e.enumlabel = 'in_progress'
  ) THEN
    ALTER TYPE "TicketStatus" ADD VALUE 'in_progress';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'TicketStatus' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE "TicketStatus" ADD VALUE 'pending';
  END IF;
END $$;
