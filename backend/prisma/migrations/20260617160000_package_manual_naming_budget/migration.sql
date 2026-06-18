-- Manual package naming, unique names, budget, and expense tracking

ALTER TABLE "procurement_packages" ADD COLUMN "zone_label" TEXT;
ALTER TABLE "procurement_packages" ADD COLUMN "package_code" TEXT;
ALTER TABLE "procurement_packages" ADD COLUMN "contract_suffix" TEXT;
ALTER TABLE "procurement_packages" ADD COLUMN "budget_amount" DECIMAL(18,2) NOT NULL DEFAULT 0;

UPDATE "procurement_packages"
SET
  "zone_label" = COALESCE(split_part("name", ' ', 1), 'Unknown'),
  "package_code" = '(PK-LG&)',
  "contract_suffix" = COALESCE("contract_ref", 'CD-000000-CW-RFB')
WHERE "zone_label" IS NULL;

ALTER TABLE "procurement_packages" ALTER COLUMN "zone_label" SET NOT NULL;
ALTER TABLE "procurement_packages" ALTER COLUMN "package_code" SET NOT NULL;
ALTER TABLE "procurement_packages" ALTER COLUMN "contract_suffix" SET NOT NULL;

DROP INDEX IF EXISTS "procurement_packages_contract_ref_key";
ALTER TABLE "procurement_packages" DROP COLUMN "package_group_key";
ALTER TABLE "procurement_packages" DROP COLUMN "sequence_number";
ALTER TABLE "procurement_packages" DROP COLUMN "contract_ref";

CREATE UNIQUE INDEX "procurement_packages_name_key" ON "procurement_packages"("name");
CREATE UNIQUE INDEX "procurement_packages_contract_suffix_key" ON "procurement_packages"("contract_suffix");

CREATE TABLE "procurement_package_expenses" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_package_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "procurement_package_expenses_package_id_idx" ON "procurement_package_expenses"("package_id");
CREATE INDEX "procurement_package_expenses_expense_date_idx" ON "procurement_package_expenses"("expense_date");

ALTER TABLE "procurement_package_expenses" ADD CONSTRAINT "procurement_package_expenses_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "procurement_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_package_expenses" ADD CONSTRAINT "procurement_package_expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
