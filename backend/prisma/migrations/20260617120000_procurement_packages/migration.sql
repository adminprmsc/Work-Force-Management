-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractor_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "tehsil_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_package_villages" (
    "package_id" TEXT NOT NULL,
    "village_id" TEXT NOT NULL,

    CONSTRAINT "procurement_package_villages_pkey" PRIMARY KEY ("package_id","village_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contractors_name_key" ON "contractors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "consultants_name_key" ON "consultants"("name");

-- AddForeignKey
ALTER TABLE "procurement_packages" ADD CONSTRAINT "procurement_packages_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_packages" ADD CONSTRAINT "procurement_packages_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_packages" ADD CONSTRAINT "procurement_packages_tehsil_id_fkey" FOREIGN KEY ("tehsil_id") REFERENCES "tehsils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_package_villages" ADD CONSTRAINT "procurement_package_villages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "procurement_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_package_villages" ADD CONSTRAINT "procurement_package_villages_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
