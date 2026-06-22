-- Procurement package ESMP baseline + survey visit date

CREATE TABLE "procurement_package_compliance" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "cesmp_plan_submitted" BOOLEAN,
    "hse_staff_hired" BOOLEAN,
    "mobilization_date" DATE,
    "baseline_submitted_at" TIMESTAMP(3),
    "baseline_submitted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_package_compliance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "procurement_package_compliance_package_id_key" ON "procurement_package_compliance"("package_id");

ALTER TABLE "procurement_package_compliance" ADD CONSTRAINT "procurement_package_compliance_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "procurement_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procurement_package_compliance" ADD CONSTRAINT "procurement_package_compliance_baseline_submitted_by_id_fkey" FOREIGN KEY ("baseline_submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "survey_responses" ADD COLUMN "visit_date" DATE;
