-- Add per-form flag: village monitoring forms require package ESMP baseline first
ALTER TABLE "survey_forms"
ADD COLUMN "requires_package_baseline" BOOLEAN NOT NULL DEFAULT false;

-- Existing C-ESMP village monitoring template
UPDATE "survey_forms"
SET "requires_package_baseline" = true
WHERE "title" = 'C-ESMP Village Monitoring Checklist';
