import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SHOPIFY_API_KEY = 'test_key';
process.env.SHOPIFY_API_SECRET = 'test_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_...';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_...';
process.env.HOST = 'http://localhost:3000'; 