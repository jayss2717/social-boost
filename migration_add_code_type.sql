-- Add CodeType enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "CodeType" AS ENUM ('INFLUENCER', 'RANDOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add codeType column to discount_codes table with default value (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE "discount_codes" ADD COLUMN "codeType" "CodeType" NOT NULL DEFAULT 'RANDOM';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update existing codes to be RANDOM type (they were all generated for random mentions)
UPDATE "discount_codes" SET "codeType" = 'RANDOM' WHERE "codeType" IS NULL; 