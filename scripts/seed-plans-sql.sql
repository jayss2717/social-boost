-- Seed plans with correct limits
-- Run this in Supabase SQL editor

-- Clear existing plans
DELETE FROM plans;

-- Insert plans with correct limits
INSERT INTO plans (id, name, "priceCents", "ugcLimit", "influencerLimit", "createdAt", "updatedAt") VALUES
('plan-starter', 'STARTER', 0, 5, 1, NOW(), NOW()),
('plan-pro', 'Pro', 2999, 300, 10, NOW(), NOW()),
('plan-scale', 'Scale', 6999, 1000, 50, NOW(), NOW()),
('plan-enterprise', 'ENTERPRISE', 0, -1, -1, NOW(), NOW());

-- Verify plans
SELECT 'Seeded Plans' as status, id, name, "priceCents", "ugcLimit", "influencerLimit" FROM plans ORDER BY "priceCents"; 