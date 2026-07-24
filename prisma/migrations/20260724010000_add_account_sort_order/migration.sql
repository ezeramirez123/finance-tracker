-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with their creation order per user, so accounts
-- created before this migration don't all collapse to the same order
-- until someone actually reorders them.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "FinancialAccount"
)
UPDATE "FinancialAccount"
SET "sortOrder" = ranked.rn
FROM ranked
WHERE "FinancialAccount"."id" = ranked."id";
