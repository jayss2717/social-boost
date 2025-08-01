-- Migration: Add Shopify Integration Fields
-- This migration adds the necessary fields for complete Shopify integration
-- including real discount code creation, webhook processing, and usage tracking

-- 1. Add shopifyPriceRuleId to discount_codes table
ALTER TABLE discount_codes 
ADD COLUMN "shopifyPriceRuleId" TEXT;

-- 2. Create order_metrics table for tracking order analytics
CREATE TABLE order_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    "discountCodesUsed" INTEGER NOT NULL DEFAULT 0,
    "customerEmail" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("merchantId") REFERENCES merchants(id) ON DELETE CASCADE
);

-- 3. Add indexes for better performance
CREATE INDEX idx_discount_codes_shopify_price_rule_id ON discount_codes("shopifyPriceRuleId");
CREATE INDEX idx_order_metrics_merchant_id ON order_metrics("merchantId");
CREATE INDEX idx_order_metrics_processed_at ON order_metrics("processedAt");
CREATE INDEX idx_order_metrics_order_id ON order_metrics("orderId");

-- 4. Add comments for documentation
COMMENT ON COLUMN discount_codes."shopifyPriceRuleId" IS 'Store Shopify price rule ID for real discount codes';
COMMENT ON TABLE order_metrics IS 'Track order analytics and usage metrics for better reporting';
COMMENT ON COLUMN order_metrics."totalAmount" IS 'Order total amount in cents';
COMMENT ON COLUMN order_metrics."discountCodesUsed" IS 'Number of discount codes used in this order';

-- 5. Update existing discount codes to have default values
UPDATE discount_codes 
SET "shopifyPriceRuleId" = NULL 
WHERE "shopifyPriceRuleId" IS NULL;

-- 6. Create a view for easy access to order metrics with merchant info
CREATE VIEW order_metrics_with_merchant AS
SELECT 
    om.*,
    m.shop,
    m."shopName"
FROM order_metrics om
JOIN merchants m ON om."merchantId" = m.id;

-- 7. Create a function to calculate revenue from orders
CREATE OR REPLACE FUNCTION calculate_merchant_revenue(merchant_id TEXT, start_date TIMESTAMP, end_date TIMESTAMP)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM("totalAmount") 
         FROM order_metrics 
         WHERE "merchantId" = merchant_id 
         AND "processedAt" BETWEEN start_date AND end_date),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to get top performing discount codes
CREATE OR REPLACE FUNCTION get_top_performing_codes(merchant_id TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    code_id TEXT,
    code TEXT,
    usage_count INTEGER,
    influencer_name TEXT,
    discount_value DOUBLE PRECISION,
    discount_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.code,
        dc."usageCount",
        i.name,
        dc."discountValue",
        dc."discountType"
    FROM discount_codes dc
    LEFT JOIN influencers i ON dc."influencerId" = i.id
    WHERE dc."merchantId" = merchant_id
    AND dc."usageCount" > 0
    ORDER BY dc."usageCount" DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_metrics_updated_at 
    BEFORE UPDATE ON order_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create indexes for better query performance on discount codes
CREATE INDEX idx_discount_codes_merchant_usage ON discount_codes("merchantId", "usageCount");
CREATE INDEX idx_discount_codes_active ON discount_codes("merchantId", "isActive") WHERE "isActive" = true;
CREATE INDEX idx_discount_codes_expires ON discount_codes("merchantId", "expiresAt") WHERE "expiresAt" IS NOT NULL;

-- Migration completed successfully
-- This adds support for:
-- 1. Real Shopify discount code creation with price rule tracking
-- 2. Comprehensive order analytics and revenue tracking
-- 3. Performance optimizations with proper indexing
-- 4. Helper functions for common analytics queries
-- 5. Automatic timestamp management 