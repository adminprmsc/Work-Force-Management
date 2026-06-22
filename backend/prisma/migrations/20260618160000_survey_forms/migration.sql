-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SurveyFieldType" AS ENUM ('TEXT', 'PARAGRAPH', 'CHECKBOXES', 'MULTIPLE_CHOICE', 'DATE', 'DROPDOWN', 'TIME', 'NUMBER', 'CNIC', 'EMAIL', 'CONTACT', 'FILE', 'IMAGE', 'SECTION_BREAK');

-- CreateEnum
CREATE TYPE "SurveyResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "survey_forms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_fields" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "type" "SurveyFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "help_text" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_assignments" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "tehsil_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "respondent_id" TEXT NOT NULL,
    "tehsil_id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,
    "settlement_id" TEXT,
    "status" "SurveyResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "survey_forms_status_idx" ON "survey_forms"("status");

-- CreateIndex
CREATE INDEX "survey_fields_form_id_idx" ON "survey_fields"("form_id");

-- CreateIndex
CREATE INDEX "survey_assignments_tehsil_id_idx" ON "survey_assignments"("tehsil_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_assignments_form_id_tehsil_id_key" ON "survey_assignments"("form_id", "tehsil_id");

-- CreateIndex
CREATE INDEX "survey_responses_assignment_id_idx" ON "survey_responses"("assignment_id");

-- CreateIndex
CREATE INDEX "survey_responses_respondent_id_idx" ON "survey_responses"("respondent_id");

-- CreateIndex
CREATE INDEX "survey_responses_form_id_idx" ON "survey_responses"("form_id");

-- CreateIndex
CREATE INDEX "survey_answers_response_id_idx" ON "survey_answers"("response_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_response_id_field_id_key" ON "survey_answers"("response_id", "field_id");

-- AddForeignKey
ALTER TABLE "survey_forms" ADD CONSTRAINT "survey_forms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_fields" ADD CONSTRAINT "survey_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_tehsil_id_fkey" FOREIGN KEY ("tehsil_id") REFERENCES "tehsils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "survey_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "survey_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_tehsil_id_fkey" FOREIGN KEY ("tehsil_id") REFERENCES "tehsils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "survey_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
