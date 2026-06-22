-- Dynamic package baseline: fields defined on survey forms, answers per package+form

ALTER TABLE "survey_forms"
ADD COLUMN "baseline_title" TEXT,
ADD COLUMN "baseline_description" TEXT;

CREATE TABLE "survey_form_baseline_fields" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "type" "SurveyFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "help_text" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "write_once" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_form_baseline_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_package_baseline_answers" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "submitted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_package_baseline_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "procurement_package_baseline_answers_package_id_field_id_key"
ON "procurement_package_baseline_answers"("package_id", "field_id");

CREATE INDEX "survey_form_baseline_fields_form_id_idx"
ON "survey_form_baseline_fields"("form_id");

CREATE INDEX "procurement_package_baseline_answers_package_id_form_id_idx"
ON "procurement_package_baseline_answers"("package_id", "form_id");

ALTER TABLE "survey_form_baseline_fields"
ADD CONSTRAINT "survey_form_baseline_fields_form_id_fkey"
FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procurement_package_baseline_answers"
ADD CONSTRAINT "procurement_package_baseline_answers_package_id_fkey"
FOREIGN KEY ("package_id") REFERENCES "procurement_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procurement_package_baseline_answers"
ADD CONSTRAINT "procurement_package_baseline_answers_form_id_fkey"
FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procurement_package_baseline_answers"
ADD CONSTRAINT "procurement_package_baseline_answers_field_id_fkey"
FOREIGN KEY ("field_id") REFERENCES "survey_form_baseline_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procurement_package_baseline_answers"
ADD CONSTRAINT "procurement_package_baseline_answers_submitted_by_id_fkey"
FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate legacy ESMP compliance into dynamic baseline for C-ESMP form
DO $$
DECLARE
  cesmp_form_id TEXT;
  f_cesmp TEXT;
  f_hse TEXT;
  f_mob TEXT;
BEGIN
  SELECT id INTO cesmp_form_id
  FROM survey_forms
  WHERE title = 'C-ESMP Village Monitoring Checklist'
  LIMIT 1;

  IF cesmp_form_id IS NOT NULL THEN
    f_cesmp := gen_random_uuid()::text;
    f_hse := gen_random_uuid()::text;
    f_mob := gen_random_uuid()::text;

    INSERT INTO survey_form_baseline_fields (id, form_id, type, label, help_text, required, write_once, "order", config)
    VALUES
      (f_cesmp, cesmp_form_id, 'MULTIPLE_CHOICE', 'Is Plan (C-ESMP) submitted?', NULL, true, false, 0,
        '{"options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"}]}'::jsonb),
      (f_hse, cesmp_form_id, 'MULTIPLE_CHOICE', 'Health, Safety and Environment (HSE) staff hired?', NULL, true, false, 1,
        '{"options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"}]}'::jsonb),
      (f_mob, cesmp_form_id, 'DATE', 'Date of mobilization',
        'Recorded once when work starts on site. Cannot be changed after saving.', true, true, 2, NULL);

    UPDATE survey_forms
    SET
      baseline_title = 'Package baseline',
      baseline_description = 'One-time information required before village visit submissions.',
      requires_package_baseline = true
    WHERE id = cesmp_form_id;

    INSERT INTO procurement_package_baseline_answers (id, package_id, form_id, field_id, value, submitted_by_id, updated_at)
    SELECT
      gen_random_uuid()::text,
      c.package_id,
      cesmp_form_id,
      f_cesmp,
      CASE WHEN c.cesmp_plan_submitted THEN '"yes"'::jsonb ELSE '"no"'::jsonb END,
      c.baseline_submitted_by_id,
      c.updated_at
    FROM procurement_package_compliance c
    WHERE c.cesmp_plan_submitted IS NOT NULL;

    INSERT INTO procurement_package_baseline_answers (id, package_id, form_id, field_id, value, submitted_by_id, updated_at)
    SELECT
      gen_random_uuid()::text,
      c.package_id,
      cesmp_form_id,
      f_hse,
      CASE WHEN c.hse_staff_hired THEN '"yes"'::jsonb ELSE '"no"'::jsonb END,
      c.baseline_submitted_by_id,
      c.updated_at
    FROM procurement_package_compliance c
    WHERE c.hse_staff_hired IS NOT NULL;

    INSERT INTO procurement_package_baseline_answers (id, package_id, form_id, field_id, value, submitted_by_id, updated_at)
    SELECT
      gen_random_uuid()::text,
      c.package_id,
      cesmp_form_id,
      f_mob,
      to_jsonb(to_char(c.mobilization_date, 'YYYY-MM-DD')),
      c.baseline_submitted_by_id,
      c.updated_at
    FROM procurement_package_compliance c
    WHERE c.mobilization_date IS NOT NULL;
  END IF;
END $$;

DROP TABLE "procurement_package_compliance";
