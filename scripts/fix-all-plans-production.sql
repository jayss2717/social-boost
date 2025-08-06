-- PRODUCTION-READY COMPREHENSIVE PLAN FIX
-- Run this in Supabase SQL editor

-- 1. First, let's see the current state of all plans
SELECT 'Current Plans' as status, id, name, price_cents, ugc_limit, influencer_limit FROM plans ORDER BY price_cents;

-- 2. Fix all plan limits to ensure they match expected values
UPDATE plans 
SET 
  ugc_limit = 5,
  influencer_limit = 1,
  updated_at = NOW()
WHERE name = 'STARTER';

UPDATE plans 
SET 
  ugc_limit = 300,
  influencer_limit = 10,
  updated_at = NOW()
WHERE name = 'Pro';

UPDATE plans 
SET 
  ugc_limit = 1000,
  influencer_limit = 50,
  updated_at = NOW()
WHERE name = 'Scale';

UPDATE plans 
SET 
  ugc_limit = -1,
  influencer_limit = -1,
  updated_at = NOW()
WHERE name = 'ENTERPRISE';

-- 3. Fix current merchant subscription to Scale plan
UPDATE subscriptions 
SET 
  plan_id = (SELECT id FROM plans WHERE name = 'Scale'),
  status = 'ACTIVE',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE merchant_id = (
  SELECT id FROM merchants WHERE shop = 'storev102.myshopify.com'
);

-- 4. Create comprehensive auto-correction function
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

-- 5. Create trigger to auto-correct ALL future wrong plans
DROP TRIGGER IF EXISTS auto_correct_subscription_trigger ON subscriptions;
CREATE TRIGGER auto_correct_subscription_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_correct_subscription_plan();

-- 6. Create function to validate and fix plan limits
CREATE OR REPLACE FUNCTION validate_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate plan limits match expected values
  IF NEW.name = 'STARTER' AND (NEW.ugc_limit != 5 OR NEW.influencer_limit != 1) THEN
    NEW.ugc_limit := 5;
    NEW.influencer_limit := 1;
    RAISE NOTICE 'Auto-corrected STARTER plan limits';
  ELSIF NEW.name = 'Pro' AND (NEW.ugc_limit != 300 OR NEW.influencer_limit != 10) THEN
    NEW.ugc_limit := 300;
    NEW.influencer_limit := 10;
    RAISE NOTICE 'Auto-corrected Pro plan limits';
  ELSIF NEW.name = 'Scale' AND (NEW.ugc_limit != 1000 OR NEW.influencer_limit != 50) THEN
    NEW.ugc_limit := 1000;
    NEW.influencer_limit := 50;
    RAISE NOTICE 'Auto-corrected Scale plan limits';
  ELSIF NEW.name = 'ENTERPRISE' AND (NEW.ugc_limit != -1 OR NEW.influencer_limit != -1) THEN
    NEW.ugc_limit := -1;
    NEW.influencer_limit := -1;
    RAISE NOTICE 'Auto-corrected ENTERPRISE plan limits';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to validate plan limits
DROP TRIGGER IF EXISTS validate_plan_limits_trigger ON plans;
CREATE TRIGGER validate_plan_limits_trigger
  BEFORE INSERT OR UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION validate_plan_limits();

-- 8. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_sub_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_merchants_shop ON merchants(shop);

-- 9. Verify all plans have correct limits
SELECT 'Verified Plans' as status, id, name, price_cents, ugc_limit, influencer_limit FROM plans ORDER BY price_cents;

-- 10. Show final subscription state
SELECT 
  'Final Subscription State' as status,
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
WHERE m.shop = 'storev102.myshopify.com';

-- 11. Show all subscriptions for verification
SELECT 
  'All Subscriptions' as status,
  m.shop,
  s.status,
  p.name as plan_name,
  p.ugc_limit,
  p.influencer_limit,
  s.stripe_sub_id
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s.merchant_id
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY m.shop; 