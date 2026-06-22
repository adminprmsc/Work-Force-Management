-- CreateEnum
CREATE TYPE "SurveyFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY');

-- DropIndex
DROP INDEX "survey_assignments_form_id_tehsil_id_key";

-- AlterTable
ALTER TABLE "survey_assignments" DROP COLUMN "due_date",
ADD COLUMN "procurement_package_id" TEXT NOT NULL,
ADD COLUMN "frequency" "SurveyFrequency" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN "start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN "end_date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "survey_assignments_procurement_package_id_idx" ON "survey_assignments"("procurement_package_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_assignments_form_id_procurement_package_id_key" ON "survey_assignments"("form_id", "procurement_package_id");

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_procurement_package_id_fkey" FOREIGN KEY ("procurement_package_id") REFERENCES "procurement_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
