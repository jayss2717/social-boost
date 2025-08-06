-- Production-Ready Subscription Fix
-- Run this in Supabase SQL editor

-- 1. First, let's see the current state
SELECT 
  'Current State' as status,
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

-- 2. Get all available plans
SELECT 'Available Plans' as status, id, name, ugc_limit, influencer_limit FROM plans ORDER BY price_cents;

-- 3. Fix the subscription to Scale plan
UPDATE subscriptions 
SET 
  plan_id = (SELECT id FROM plans WHERE name = 'Scale'),
  status = 'ACTIVE',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE merchant_id = (
  SELECT id FROM merchants WHERE shop = 'storev101.myshopify.com'
);

-- 4. Verify the fix
SELECT 
  'After Fix' as status,
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

-- 5. Add safeguards: Create a function to auto-correct wrong plans
CREATE OR REPLACE FUNCTION auto_correct_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription is updated and plan is STARTER but stripe_sub_id is not null
  -- (meaning they paid for a plan), auto-correct to Scale
  IF NEW.plan_id = (SELECT id FROM plans WHERE name = 'STARTER') 
     AND NEW.stripe_sub_id IS NOT NULL 
     AND OLD.plan_id = (SELECT id FROM plans WHERE name = 'STARTER') THEN
    
    NEW.plan_id := (SELECT id FROM plans WHERE name = 'Scale');
    NEW.updated_at := NOW();
    
    RAISE NOTICE 'Auto-corrected subscription from STARTER to Scale for merchant %', NEW.merchant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-correct wrong plans
DROP TRIGGER IF EXISTS auto_correct_subscription_trigger ON subscriptions;
CREATE TRIGGER auto_correct_subscription_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_correct_subscription_plan();

-- 7. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_sub_id);

-- 8. Show final state
SELECT 
  'Final State' as status,
  m.id as merchant_id,
  m.shop,
  s.id as subscription_id,
  s.status,
  s.stripe_sub_id,
  p.name as plan_name,
  p.ugc_limit,
  p.influencer_limit,
  s.current_period_end
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s.merchant_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE m.shop = 'storev101.myshopify.com'; 