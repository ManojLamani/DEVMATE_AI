-- DropIndex
DROP INDEX "users_googleId_key";

-- Remove accounts that were created via Google and have no password
DELETE FROM "users" WHERE "password" IS NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleId",
ALTER COLUMN "password" SET NOT NULL;
