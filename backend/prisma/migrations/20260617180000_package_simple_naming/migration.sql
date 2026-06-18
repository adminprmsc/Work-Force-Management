-- Simplify package naming: store a single unique name only

DROP INDEX IF EXISTS "procurement_packages_contract_suffix_key";

ALTER TABLE "procurement_packages" DROP COLUMN IF EXISTS "zone_label";
ALTER TABLE "procurement_packages" DROP COLUMN IF EXISTS "package_code";
ALTER TABLE "procurement_packages" DROP COLUMN IF EXISTS "contract_suffix";
