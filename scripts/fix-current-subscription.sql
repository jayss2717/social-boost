-- Fix subscription for storev101.myshopify.com to Scale plan
-- Run this in Supabase SQL editor

-- First, let's see the current state
SELECT 
  m.id as merchant_id,
  m.shop,
  s.id as subscription_id,
  s.status,
  s.stripe_sub_id,
  p.name as plan_name,
  p.ugc_limit,
  p.influencer_limit
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s.merchant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE m.shop = 'storev101.myshopify.com';

-- Get the Scale plan ID
SELECT id, name, ugc_limit, influencer_limit 
FROM plans 
WHERE name = 'Scale';

-- Update the subscription to Scale plan
UPDATE subscriptions 
SET 
  plan_id = (SELECT id FROM plans WHERE name = 'Scale'),
  status = 'ACTIVE',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE merchant_id = (
  SELECT id FROM merchants WHERE shop = 'storev101.myshopify.com'
);

-- Verify the update
SELECT 
  m.id as merchant_id,
  m.shop,
  s.id as subscription_id,
  s.status,
  s.stripe_sub_id,
  p.name as plan_name,
  p.ugc_limit,
  p.influencer_limit
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s.merchant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE m.shop = 'storev101.myshopify.com'; 