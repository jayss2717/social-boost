-- Fix current merchant to Pro plan
-- Run this in Supabase SQL editor

-- Update subscription to Pro plan
UPDATE subscriptions 
SET 
  "planId" = (SELECT id FROM plans WHERE name = 'Pro'),
  status = 'ACTIVE',
  "currentPeriodEnd" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW()
WHERE "merchantId" = (
  SELECT id FROM merchants WHERE shop = 'storev102.myshopify.com'
);

-- Verify the fix
SELECT 
  'Fixed Subscription' as status,
  m.shop,
  s.status,
  p.name as plan_name,
  p."ugcLimit",
  p."influencerLimit",
  s."stripeSubId"
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s."merchantId"
LEFT JOIN plans p ON s."planId" = p.id
WHERE m.shop = 'storev102.myshopify.com'; 