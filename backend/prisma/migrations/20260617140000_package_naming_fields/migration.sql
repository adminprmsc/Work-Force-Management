-- AlterTable
ALTER TABLE "procurement_packages" ADD COLUMN "package_group_key" TEXT NOT NULL DEFAULT '';
ALTER TABLE "procurement_packages" ADD COLUMN "sequence_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "procurement_packages" ADD COLUMN "contract_ref" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "procurement_packages_contract_ref_key" ON "procurement_packages"("contract_ref");
