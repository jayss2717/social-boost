-- SQL Script to Update Commission Calculation Preference
-- This script adds the new commissionCalculationBase setting to existing merchant settings

-- First, let's check what merchants we have
SELECT 
    id,
    shop,
    "createdAt",
    "updatedAt"
FROM merchants 
ORDER BY "createdAt" DESC;

-- Update existing merchant settings to include commissionCalculationBase
-- This will add the new field to the commissionSettings JSON object
UPDATE merchant_settings
SET "commissionSettings" = COALESCE("commissionSettings", '{}'::jsonb) || 
    '{"commissionCalculationBase": "DISCOUNTED_AMOUNT"}'::jsonb
WHERE "commissionSettings" IS NULL 
   OR "commissionSettings"->>'commissionCalculationBase' IS NULL;

-- Verify the updates
SELECT 
    m.shop,
    ms."commissionSettings"->>'commissionCalculationBase' as calculation_base,
    ms."commissionSettings"->>'defaultRate' as default_rate,
    ms."commissionSettings"->>'maxRate' as max_rate,
    ms."commissionSettings"->>'minRate' as min_rate,
    ms."commissionSettings"->>'autoPayout' as auto_payout
FROM merchants m
JOIN merchant_settings ms ON m.id = ms."merchantId"
ORDER BY m."createdAt" DESC;

-- Optional: Update specific merchants to use ORIGINAL_AMOUNT if needed
-- Uncomment and modify the shop name below if you want to set a specific merchant to use ORIGINAL_AMOUNT
/*
UPDATE merchant_settings
SET "commissionSettings" = "commissionSettings" || 
    '{"commissionCalculationBase": "ORIGINAL_AMOUNT"}'::jsonb
WHERE "merchantId" IN (
    SELECT id FROM merchants WHERE shop = 'your-shop-name.myshopify.com'
);
*/

-- Show final state of all merchant settings
SELECT 
    m.shop,
    ms."commissionSettings"
FROM merchants m
JOIN merchant_settings ms ON m.id = ms."merchantId"
ORDER BY m."createdAt" DESC; 