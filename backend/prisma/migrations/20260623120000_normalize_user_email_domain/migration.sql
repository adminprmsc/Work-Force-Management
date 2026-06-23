-- Normalize legacy dev/seed email domains to ens.com (matches frontend user management).
UPDATE "users"
SET "email" = REPLACE("email", '@wfm.local', '@ens.com')
WHERE "email" LIKE '%@wfm.local';

UPDATE "users"
SET "email" = REPLACE("email", '@ens.local', '@ens.com')
WHERE "email" LIKE '%@ens.local';

UPDATE "users"
SET "email" = REPLACE("email", '@wfm.com', '@ens.com')
WHERE "email" LIKE '%@wfm.com';
