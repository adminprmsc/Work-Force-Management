-- Baseline answers reference field ids only; editing form baseline fields must not
-- cascade-delete all package baseline data when fields are updated in place.

ALTER TABLE "procurement_package_baseline_answers"
    DROP CONSTRAINT IF EXISTS "procurement_package_baseline_answers_field_id_fkey";

CREATE INDEX IF NOT EXISTS "procurement_package_baseline_answers_field_id_idx"
    ON "procurement_package_baseline_answers"("field_id");
