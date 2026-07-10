-- Convert Ticket.id from integer to SB + 7-digit public IDs (e.g. SB4826323)
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_pkey";
ALTER TABLE "Ticket" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "Ticket_id_seq";
ALTER TABLE "Ticket" ALTER COLUMN "id" TYPE TEXT USING (
  'SB' || lpad(("id"::integer % 10000000)::text, 7, '0')
);
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");
