-- Capture live GPS coordinates when a tehsil RA submits a site visit response.
ALTER TABLE "survey_responses"
  ADD COLUMN "submitted_latitude" DOUBLE PRECISION,
  ADD COLUMN "submitted_longitude" DOUBLE PRECISION,
  ADD COLUMN "submitted_location_accuracy" DOUBLE PRECISION,
  ADD COLUMN "submitted_location_captured_at" TIMESTAMP(3);
