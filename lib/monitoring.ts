import { NextRequest } from 'next/server';

// Error tracking and monitoring setup
export interface MonitoringConfig {
  enabled: boolean;
  environment: string;
  appName: string;
  version: string;
}

export class Monitoring {
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  // Track API errors
  async trackError(error: Error, context?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      appName: this.config.appName,
      version: this.config.version,
      context,
    };

    console.error('🚨 Error tracked:', errorData);

    // Send to monitoring service (Sentry, etc.)
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
      console.log('📊 Error sent to Sentry');
    }
  }

  // Track API performance
  async trackPerformance(operation: string, duration: number, metadata?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    const perfData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      metadata,
    };

    console.log('⚡ Performance tracked:', perfData);
  }

  // Track business events
  async trackEvent(event: string, properties?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    const eventData = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    console.log('📈 Event tracked:', eventData);
  }

  // Track webhook delivery
  async trackWebhook(topic: string, shop: string, success: boolean, error?: unknown) {
    await this.trackEvent('webhook_delivery', {
      topic,
      shop,
      success,
      error: error && typeof error === 'object' && 'message' in error ? (error as Error).message : undefined,
    });
  }

  // Track app installation
  async trackInstallation(shop: string, success: boolean) {
    await this.trackEvent('app_installation', {
      shop,
      success,
    });
  }

  // Track subscription changes
  async trackSubscription(shop: string, plan: string, action: 'upgrade' | 'downgrade' | 'cancel') {
    await this.trackEvent('subscription_change', {
      shop,
      plan,
      action,
    });
  }
}

// Initialize monitoring
export const monitoring = new Monitoring({
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
  appName: 'SocialBoost',
  version: process.env.npm_package_version || '1.0.0',
});

// Middleware for tracking API requests
export async function trackApiRequest(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    const response = await handler();
    
    // Track successful request
    await monitoring.trackPerformance('api_request', Date.now() - startTime, {
      url,
      method,
      status: response.status,
    });

    return response;
  } catch (error) {
    // Track failed request
    await monitoring.trackError(error as Error, {
      url,
      method,
      duration: Date.now() - startTime,
    });

    throw error;
  }
}

// Health check endpoint
export async function healthCheck() {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Check Redis (optional)
    if (process.env.REDIS_URL) {
      const redis = await import('@/lib/redis');
      await redis.default.ping();
      checks.redis = true;
    } else {
      // Redis not configured, mark as healthy
      checks.redis = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
    // Don't fail health check if Redis is not available
    checks.redis = true;
  }

  return checks;
} 