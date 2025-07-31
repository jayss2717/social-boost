-- Add CodeType enum
CREATE TYPE "CodeType" AS ENUM ('INFLUENCER', 'RANDOM');

-- Add codeType column to discount_codes table with default value
ALTER TABLE "discount_codes" ADD COLUMN "codeType" "CodeType" NOT NULL DEFAULT 'RANDOM';

-- Update existing codes to be RANDOM type (they were all generated for random mentions)
UPDATE "discount_codes" SET "codeType" = 'RANDOM' WHERE "codeType" IS NULL; 