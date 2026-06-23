-- Normalize legacy dev/seed email domains to ens.com (matches frontend user management).
-- Handles duplicate mailboxes across @wfm.local / @wfm.com / @ens.local safely.

-- When the same mailbox exists on @wfm.com and @wfm.local, keep the @wfm.com row.
DELETE FROM "users" AS local_user
WHERE local_user."email" LIKE '%@wfm.local'
  AND EXISTS (
    SELECT 1
    FROM "users" AS prod_user
    WHERE SPLIT_PART(prod_user."email", '@', 1) = SPLIT_PART(local_user."email", '@', 1)
      AND prod_user."email" LIKE '%@wfm.com'
      AND prod_user."id" <> local_user."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "survey_responses" sr WHERE sr."respondent_id" = local_user."id"
  );

-- Drop legacy rows when the target @ens.com address already exists (only if unused).
DELETE FROM "users" AS legacy
WHERE (
    legacy."email" LIKE '%@wfm.local'
    OR legacy."email" LIKE '%@ens.local'
    OR legacy."email" LIKE '%@wfm.com'
  )
  AND EXISTS (
    SELECT 1
    FROM "users" AS canonical
    WHERE canonical."email" = CASE
        WHEN legacy."email" LIKE '%@wfm.local' THEN REPLACE(legacy."email", '@wfm.local', '@ens.com')
        WHEN legacy."email" LIKE '%@ens.local' THEN REPLACE(legacy."email", '@ens.local', '@ens.com')
        WHEN legacy."email" LIKE '%@wfm.com' THEN REPLACE(legacy."email", '@wfm.com', '@ens.com')
        ELSE legacy."email"
      END
      AND canonical."id" <> legacy."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "survey_responses" sr WHERE sr."respondent_id" = legacy."id"
  );

UPDATE "users" AS u
SET "email" = REPLACE(u."email", '@wfm.local', '@ens.com')
WHERE u."email" LIKE '%@wfm.local'
  AND NOT EXISTS (
    SELECT 1
    FROM "users" AS c
    WHERE c."email" = REPLACE(u."email", '@wfm.local', '@ens.com')
      AND c."id" <> u."id"
  );

UPDATE "users" AS u
SET "email" = REPLACE(u."email", '@ens.local', '@ens.com')
WHERE u."email" LIKE '%@ens.local'
  AND NOT EXISTS (
    SELECT 1
    FROM "users" AS c
    WHERE c."email" = REPLACE(u."email", '@ens.local', '@ens.com')
      AND c."id" <> u."id"
  );

UPDATE "users" AS u
SET "email" = REPLACE(u."email", '@wfm.com', '@ens.com')
WHERE u."email" LIKE '%@wfm.com'
  AND NOT EXISTS (
    SELECT 1
    FROM "users" AS c
    WHERE c."email" = REPLACE(u."email", '@wfm.com', '@ens.com')
      AND c."id" <> u."id"
  );
