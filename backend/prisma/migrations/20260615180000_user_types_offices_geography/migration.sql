-- Redesign: user types, offices, tehsil geography (replaces teams/RBAC v1)

DELETE FROM audit_logs;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM users;

DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_reports_to_id_fkey;
ALTER TABLE users DROP COLUMN IF EXISTS reports_to_id;

-- UserRole enum replacement
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM (
  'SENIOR_MANAGER_ES',
  'RA_ENVIRONMENT_HO',
  'RA_ES_TEHSIL',
  'WORLD_BANK_USER'
);
ALTER TABLE users
  ALTER COLUMN role TYPE "UserRole"
  USING 'SENIOR_MANAGER_ES'::"UserRole";
DROP TYPE "UserRole_old";

-- AuditAction: drop team actions
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
CREATE TYPE "AuditAction" AS ENUM (
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'USER_CREDENTIALS_RESET'
);
ALTER TABLE audit_logs
  ALTER COLUMN action TYPE "AuditAction"
  USING 'USER_CREATED'::"AuditAction";
DROP TYPE "AuditAction_old";

-- Office type
CREATE TYPE "OfficeType" AS ENUM (
  'HEAD_OFFICE',
  'WORLD_BANK_OFFICE',
  'TEHSIL_OFFICE'
);

-- Geography
CREATE TABLE "tehsils" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tehsils_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tehsils_name_key" ON "tehsils"("name");

CREATE TABLE "villages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tehsil_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "villages_tehsil_id_name_key" ON "villages"("tehsil_id", "name");

CREATE TABLE "settlements" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "village_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settlements_village_id_name_key" ON "settlements"("village_id", "name");

CREATE TABLE "offices" (
  "id" TEXT NOT NULL,
  "type" "OfficeType" NOT NULL,
  "name" TEXT NOT NULL,
  "tehsil_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "offices_tehsil_id_key" ON "offices"("tehsil_id");

ALTER TABLE "users" ADD COLUMN "office_id" TEXT;

ALTER TABLE "villages"
  ADD CONSTRAINT "villages_tehsil_id_fkey"
  FOREIGN KEY ("tehsil_id") REFERENCES "tehsils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_village_id_fkey"
  FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offices"
  ADD CONSTRAINT "offices_tehsil_id_fkey"
  FOREIGN KEY ("tehsil_id") REFERENCES "tehsils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD CONSTRAINT "users_office_id_fkey"
  FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
