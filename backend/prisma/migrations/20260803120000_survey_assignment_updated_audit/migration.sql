-- Add audit action for survey assignment timeline updates.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SURVEY_ASSIGNMENT_UPDATED';
