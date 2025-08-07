-- Clear existing plans
DELETE FROM "Plan";

-- Insert plans
INSERT INTO "Plan" (id, name, "priceCents", "ugcLimit", "influencerLimit", "createdAt", "updatedAt") VALUES
('plan_starter', 'Starter', 0, 5, 1, NOW(), NOW()),
('plan_pro', 'Pro', 2999, 300, 10, NOW(), NOW()),
('plan_scale', 'Scale', 6999, 1000, 50, NOW(), NOW()),
('plan_enterprise', 'Enterprise', 0, -1, -1, NOW(), NOW());

-- Verify plans were created
SELECT name, "priceCents", "ugcLimit", "influencerLimit" FROM "Plan" ORDER BY "priceCents"; 