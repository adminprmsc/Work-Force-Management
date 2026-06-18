#!/bin/sh
set -e

cd /app

echo "Generating Prisma client..."
npx prisma generate

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding fixed geography and default accounts..."
npm run db:seed

echo "Starting NestJS in watch mode..."
exec npm run start:dev
