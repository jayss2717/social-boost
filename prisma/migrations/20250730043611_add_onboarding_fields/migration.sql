/*
  Warnings:

  - A unique constraint covering the columns `[shopifyShopId]` on the table `merchants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingData" JSONB,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shopCurrency" TEXT,
ADD COLUMN     "shopDomain" TEXT,
ADD COLUMN     "shopEmail" TEXT,
ADD COLUMN     "shopLocale" TEXT,
ADD COLUMN     "shopName" TEXT,
ADD COLUMN     "shopTimezone" TEXT,
ADD COLUMN     "shopifyShopId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "merchants_shopifyShopId_key" ON "merchants"("shopifyShopId");
