-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MOBILE_APP_UPLOADED';

-- CreateTable
CREATE TABLE "mobile_app_releases" (
    "id" TEXT NOT NULL,
    "version_name" TEXT NOT NULL,
    "version_code" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "release_notes" TEXT,
    "is_latest" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_app_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobile_app_releases_version_code_key" ON "mobile_app_releases"("version_code");

-- CreateIndex
CREATE INDEX "mobile_app_releases_is_latest_idx" ON "mobile_app_releases"("is_latest");

-- CreateIndex
CREATE INDEX "mobile_app_releases_created_at_idx" ON "mobile_app_releases"("created_at");

-- CreateIndex
CREATE INDEX "mobile_app_releases_uploaded_by_id_idx" ON "mobile_app_releases"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "mobile_app_releases" ADD CONSTRAINT "mobile_app_releases_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
