-- Extend survey response workflow with review states and audit trail.

CREATE TYPE "SurveyResponseReviewAction" AS ENUM (
  'SUBMITTED',
  'RESUBMITTED',
  'SAVED',
  'ACCEPTED',
  'REJECTED',
  'REVERTED'
);

ALTER TYPE "SurveyResponseStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "SurveyResponseStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "SurveyResponseStatus" ADD VALUE IF NOT EXISTS 'REVERTED';

ALTER TABLE "survey_responses"
  ADD COLUMN "last_edited_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "accepted_at" TIMESTAMP(3),
  ADD COLUMN "accepted_by_id" TEXT,
  ADD COLUMN "rejected_at" TIMESTAMP(3),
  ADD COLUMN "rejected_by_id" TEXT,
  ADD COLUMN "reverted_at" TIMESTAMP(3),
  ADD COLUMN "reverted_by_id" TEXT,
  ADD COLUMN "review_remarks" TEXT;

CREATE INDEX "survey_responses_status_idx" ON "survey_responses"("status");

ALTER TABLE "survey_responses"
  ADD CONSTRAINT "survey_responses_accepted_by_id_fkey"
    FOREIGN KEY ("accepted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "survey_responses_rejected_by_id_fkey"
    FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "survey_responses_reverted_by_id_fkey"
    FOREIGN KEY ("reverted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "survey_response_review_events" (
  "id" TEXT NOT NULL,
  "response_id" TEXT NOT NULL,
  "action" "SurveyResponseReviewAction" NOT NULL,
  "actor_id" TEXT NOT NULL,
  "remarks" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "survey_response_review_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "survey_response_review_events_response_id_idx"
  ON "survey_response_review_events"("response_id");
CREATE INDEX "survey_response_review_events_actor_id_idx"
  ON "survey_response_review_events"("actor_id");

ALTER TABLE "survey_response_review_events"
  ADD CONSTRAINT "survey_response_review_events_response_id_fkey"
    FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "survey_response_review_events_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
