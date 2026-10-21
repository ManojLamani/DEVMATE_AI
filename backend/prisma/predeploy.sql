-- Runs before `prisma db push` on Render.
-- Accounts created with the removed Google sign-in have no password and can no longer log in.
-- Delete them (related rows cascade) so db push can make users.password NOT NULL.
-- Safe to run repeatedly and on an empty database.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DELETE FROM "users" WHERE "password" IS NULL;
  END IF;
END $$;
