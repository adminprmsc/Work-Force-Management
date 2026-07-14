-- Per-village budget allocation on the package/village join.
ALTER TABLE "procurement_package_villages"
    ADD COLUMN "allocated_budget" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Backfill existing packages with an equal split of the package budget across
-- their villages (rounded to 2 decimals). The app recomputes / lets managers
-- fine-tune allocations on the next edit.
UPDATE "procurement_package_villages" ppv
SET "allocated_budget" = ROUND(pkg."budget_amount" / counts.village_count, 2)
FROM "procurement_packages" pkg,
     (
         SELECT "package_id", COUNT(*)::numeric AS village_count
         FROM "procurement_package_villages"
         GROUP BY "package_id"
     ) counts
WHERE ppv."package_id" = pkg."id"
  AND ppv."package_id" = counts."package_id"
  AND counts.village_count > 0;
