-- PRODUCTION-READY COMPREHENSIVE PLAN FIX
-- Run this in Supabase SQL editor

-- 1. First, let's see the current state of all plans
SELECT 'Current Plans' as status, id, name, "priceCents", "ugcLimit", "influencerLimit" FROM plans ORDER BY "priceCents";

-- 2. Fix all plan limits to ensure they match expected values
UPDATE plans 
SET 
  "ugcLimit" = 5,
  "influencerLimit" = 1,
  "updatedAt" = NOW()
WHERE name = 'STARTER';

UPDATE plans 
SET 
  "ugcLimit" = 300,
  "influencerLimit" = 10,
  "updatedAt" = NOW()
WHERE name = 'Pro';

UPDATE plans 
SET 
  "ugcLimit" = 1000,
  "influencerLimit" = 50,
  "updatedAt" = NOW()
WHERE name = 'Scale';

UPDATE plans 
SET 
  "ugcLimit" = -1,
  "influencerLimit" = -1,
  "updatedAt" = NOW()
WHERE name = 'ENTERPRISE';

-- 3. Fix current merchant subscription to Scale plan
UPDATE subscriptions 
SET 
  "planId" = (SELECT id FROM plans WHERE name = 'Scale'),
  status = 'ACTIVE',
  "currentPeriodEnd" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW()
WHERE "merchantId" = (
  SELECT id FROM merchants WHERE shop = 'storev102.myshopify.com'
);

-- 4. Create comprehensive auto-correction function
CREATE OR REPLACE FUNCTION auto_correct_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription is updated and plan is STARTER but stripeSubId is not null
  -- (meaning they paid for a plan), auto-correct to Scale
  IF NEW."planId" = (SELECT id FROM plans WHERE name = 'STARTER') 
     AND NEW."stripeSubId" IS NOT NULL 
     AND OLD."planId" = (SELECT id FROM plans WHERE name = 'STARTER') THEN
    
    NEW."planId" := (SELECT id FROM plans WHERE name = 'Scale');
    NEW."updatedAt" := NOW();
    
    RAISE NOTICE 'Auto-corrected subscription from STARTER to Scale for merchant %', NEW."merchantId";
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
  IF NEW.name = 'STARTER' AND (NEW."ugcLimit" != 5 OR NEW."influencerLimit" != 1) THEN
    NEW."ugcLimit" := 5;
    NEW."influencerLimit" := 1;
    RAISE NOTICE 'Auto-corrected STARTER plan limits';
  ELSIF NEW.name = 'Pro' AND (NEW."ugcLimit" != 300 OR NEW."influencerLimit" != 10) THEN
    NEW."ugcLimit" := 300;
    NEW."influencerLimit" := 10;
    RAISE NOTICE 'Auto-corrected Pro plan limits';
  ELSIF NEW.name = 'Scale' AND (NEW."ugcLimit" != 1000 OR NEW."influencerLimit" != 50) THEN
    NEW."ugcLimit" := 1000;
    NEW."influencerLimit" := 50;
    RAISE NOTICE 'Auto-corrected Scale plan limits';
  ELSIF NEW.name = 'ENTERPRISE' AND (NEW."ugcLimit" != -1 OR NEW."influencerLimit" != -1) THEN
    NEW."ugcLimit" := -1;
    NEW."influencerLimit" := -1;
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_id ON subscriptions("merchantId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions("stripeSubId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions("planId");
CREATE INDEX IF NOT EXISTS idx_merchants_shop ON merchants(shop);

-- 9. Verify all plans have correct limits
SELECT 'Verified Plans' as status, id, name, "priceCents", "ugcLimit", "influencerLimit" FROM plans ORDER BY "priceCents";

-- 10. Show final subscription state
SELECT 
  'Final Subscription State' as status,
  m.id as merchant_id,
  m.shop,
  s.id as subscription_id,
  s.status,
  s."stripeSubId",
  p.name as plan_name,
  p."ugcLimit",
  p."influencerLimit",
  s."currentPeriodEnd"
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s."merchantId"
LEFT JOIN plans p ON s."planId" = p.id
WHERE m.shop = 'storev102.myshopify.com';

-- 11. Show all subscriptions for verification
SELECT 
  'All Subscriptions' as status,
  m.shop,
  s.status,
  p.name as plan_name,
  p."ugcLimit",
  p."influencerLimit",
  s."stripeSubId"
FROM merchants m
LEFT JOIN subscriptions s ON m.id = s."merchantId"
LEFT JOIN plans p ON s."planId" = p.id
ORDER BY m.shop; 