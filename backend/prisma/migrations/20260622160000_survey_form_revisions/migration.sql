-- Immutable published form revisions. Assignments and responses pin to a revision
-- so editing/republishing the live form does not destroy historical submissions.

CREATE TABLE "survey_form_revisions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requires_package_baseline" BOOLEAN NOT NULL DEFAULT false,
    "baseline_title" TEXT,
    "baseline_description" TEXT,
    "fields" JSONB NOT NULL,
    "baseline_fields" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_form_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "survey_form_revisions_form_id_version_key"
    ON "survey_form_revisions"("form_id", "version");
CREATE INDEX "survey_form_revisions_form_id_idx"
    ON "survey_form_revisions"("form_id");

ALTER TABLE "survey_forms"
    ADD COLUMN "current_revision_id" TEXT;

CREATE UNIQUE INDEX "survey_forms_current_revision_id_key"
    ON "survey_forms"("current_revision_id");

ALTER TABLE "survey_assignments"
    ADD COLUMN "form_revision_id" TEXT;

ALTER TABLE "survey_responses"
    ADD COLUMN "form_revision_id" TEXT;

-- Backfill revision v1 for every published form from its current live fields.
INSERT INTO "survey_form_revisions" (
    "id",
    "form_id",
    "version",
    "title",
    "description",
    "requires_package_baseline",
    "baseline_title",
    "baseline_description",
    "fields",
    "baseline_fields",
    "published_at",
    "created_at"
)
SELECT
    gen_random_uuid()::text,
    sf."id",
    1,
    sf."title",
    sf."description",
    sf."requires_package_baseline",
    sf."baseline_title",
    sf."baseline_description",
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', f."id",
                    'type', f."type",
                    'label', f."label",
                    'helpText', f."help_text",
                    'required', f."required",
                    'order', f."order",
                    'config', f."config"
                )
                ORDER BY f."order" ASC
            )
            FROM "survey_fields" f
            WHERE f."form_id" = sf."id"
        ),
        '[]'::jsonb
    ),
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', bf."id",
                    'type', bf."type",
                    'label', bf."label",
                    'helpText', bf."help_text",
                    'required', bf."required",
                    'writeOnce', bf."write_once",
                    'order', bf."order",
                    'config', bf."config"
                )
                ORDER BY bf."order" ASC
            )
            FROM "survey_form_baseline_fields" bf
            WHERE bf."form_id" = sf."id"
        ),
        '[]'::jsonb
    ),
    COALESCE(sf."published_at", sf."updated_at"),
    CURRENT_TIMESTAMP
FROM "survey_forms" sf
WHERE sf."status" = 'PUBLISHED';

UPDATE "survey_forms" sf
SET "current_revision_id" = r."id"
FROM "survey_form_revisions" r
WHERE r."form_id" = sf."id"
  AND r."version" = 1
  AND sf."status" = 'PUBLISHED';

UPDATE "survey_assignments" sa
SET "form_revision_id" = sf."current_revision_id"
FROM "survey_forms" sf
WHERE sa."form_id" = sf."id"
  AND sf."current_revision_id" IS NOT NULL;

UPDATE "survey_responses" sr
SET "form_revision_id" = sa."form_revision_id"
FROM "survey_assignments" sa
WHERE sr."assignment_id" = sa."id"
  AND sa."form_revision_id" IS NOT NULL;

-- Detach answers from live editable fields (answers reference revision field ids).
ALTER TABLE "survey_answers" DROP CONSTRAINT IF EXISTS "survey_answers_field_id_fkey";

ALTER TABLE "survey_form_revisions"
    ADD CONSTRAINT "survey_form_revisions_form_id_fkey"
    FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_forms"
    ADD CONSTRAINT "survey_forms_current_revision_id_fkey"
    FOREIGN KEY ("current_revision_id") REFERENCES "survey_form_revisions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "survey_assignments"
    ADD CONSTRAINT "survey_assignments_form_revision_id_fkey"
    FOREIGN KEY ("form_revision_id") REFERENCES "survey_form_revisions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "survey_responses"
    ADD CONSTRAINT "survey_responses_form_revision_id_fkey"
    FOREIGN KEY ("form_revision_id") REFERENCES "survey_form_revisions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Assignments/responses only exist for published forms in practice; enforce NOT NULL.
ALTER TABLE "survey_assignments"
    ALTER COLUMN "form_revision_id" SET NOT NULL;

ALTER TABLE "survey_responses"
    ALTER COLUMN "form_revision_id" SET NOT NULL;

CREATE INDEX "survey_assignments_form_revision_id_idx"
    ON "survey_assignments"("form_revision_id");

CREATE INDEX "survey_responses_form_revision_id_idx"
    ON "survey_responses"("form_revision_id");

CREATE INDEX "survey_answers_field_id_idx"
    ON "survey_answers"("field_id");
