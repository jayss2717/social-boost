-- AlterTable
ALTER TABLE "merchant_settings" ADD COLUMN     "linkPattern" TEXT NOT NULL DEFAULT '/discount/{code}',
ADD COLUMN     "website" TEXT;
