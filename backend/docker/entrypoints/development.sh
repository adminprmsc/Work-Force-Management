#!/bin/sh
set -e

cd /app

# The named node_modules volume can lag behind package.json after new deps
# (e.g. @supabase/supabase-js, multer). Reconcile on every container start.
echo "Installing/updating dependencies..."
npm install --no-audit --no-fund

echo "Generating Prisma client..."
npx prisma generate

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding fixed geography and default accounts..."
npm run db:seed

echo "Starting NestJS in watch mode..."
exec npm run start:dev
