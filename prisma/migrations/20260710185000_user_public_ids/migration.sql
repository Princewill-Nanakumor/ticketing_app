-- Convert User.id from cuid to random public IDs (e.g. AU4729344)
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_userId_fkey";

ALTER TABLE "User" ADD COLUMN "newId" TEXT;

UPDATE "User"
SET "newId" =
  chr(65 + (get_byte(decode(md5(id), 'hex'), 0) % 26)) ||
  chr(65 + (get_byte(decode(md5(id), 'hex'), 1) % 26)) ||
  lpad((('x' || substr(md5(id || '-n'), 1, 8))::bit(32)::int % 10000000)::text, 7, '0');

-- Resolve rare collisions by appending a short suffix from the old id hash
UPDATE "User" u
SET "newId" = left(u."newId", 2) || lpad(
  ((('x' || substr(md5(u.id || u."newId"), 1, 8))::bit(32)::int % 10000000)::text),
  7,
  '0'
)
WHERE u.id IN (
  SELECT id
  FROM (
    SELECT id, "newId", COUNT(*) OVER (PARTITION BY "newId") AS dupes
    FROM "User"
  ) counted
  WHERE dupes > 1
);

UPDATE "Ticket" t
SET "userId" = u."newId"
FROM "User" u
WHERE t."userId" = u.id;

ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" RENAME COLUMN "newId" TO "id";
ALTER TABLE "User" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
