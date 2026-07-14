-- Survey evidence attachments stored in Supabase Storage; metadata tracked here.

CREATE TABLE "survey_attachments" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "form_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "response_id" TEXT,
    "field_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "survey_attachments_form_id_idx" ON "survey_attachments"("form_id");
CREATE INDEX "survey_attachments_response_id_idx" ON "survey_attachments"("response_id");
CREATE INDEX "survey_attachments_uploaded_by_id_idx" ON "survey_attachments"("uploaded_by_id");
CREATE INDEX "survey_attachments_assignment_id_idx" ON "survey_attachments"("assignment_id");

ALTER TABLE "survey_attachments"
    ADD CONSTRAINT "survey_attachments_form_id_fkey"
    FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_attachments"
    ADD CONSTRAINT "survey_attachments_response_id_fkey"
    FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "survey_attachments"
    ADD CONSTRAINT "survey_attachments_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
