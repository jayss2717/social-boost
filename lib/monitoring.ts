import { NextRequest } from 'next/server';

export interface LogContext {
  merchantId?: string;
  shop?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  error?: Error;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private performanceMetrics: PerformanceMetrics[] = [];

  private constructor() {
    // Initialize logging
    this.setupPerformanceMonitoring();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupPerformanceMonitoring() {
    // Log performance metrics every 5 minutes
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Performance monitoring
  trackPerformance(operation: string, duration: number, success: boolean, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      success,
      timestamp: new Date(),
      metadata,
    };

    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    // Log slow operations
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, {
        operation,
        duration,
        metadata,
      });
    }
  }

  private logPerformanceMetrics() {
    if (this.performanceMetrics.length === 0) return;

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > fiveMinutesAgo
    );

    if (recentMetrics.length === 0) return;

    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
    const totalOperations = recentMetrics.length;

    this.info(`Performance Summary (last 5min): ${totalOperations} operations, avg ${avgDuration.toFixed(2)}ms, ${(successRate * 100).toFixed(1)}% success rate`);
  }

  // Request logging
  logRequest(request: NextRequest, response: Response, duration: number) {
    const context: LogContext = {
      requestId: this.generateRequestId(),
      operation: 'http_request',
      duration,
      metadata: {
        method: request.method,
        url: request.url,
        status: response.status,
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || request.headers.get('x-forwarded-for'),
      },
    };

    if (response.status >= 400) {
      this.error(`HTTP ${response.status}`, context);
    } else {
      this.info(`HTTP ${response.status} ${request.method} ${request.nextUrl.pathname}`, context);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, duration: number, success: boolean, context?: LogContext) {
    this.trackPerformance(`db_${operation}`, duration, success, context?.metadata);
    
    if (!success) {
      this.error(`Database operation failed: ${operation}`, context);
    } else if (duration > 500) {
      this.warn(`Slow database operation: ${operation} took ${duration}ms`, context);
    }
  }

  // API operation logging
  logApiOperation(operation: string, duration: number, success: boolean, context?: LogContext) {
    this.trackPerformance(`api_${operation}`, duration, success, context?.metadata);
    
    if (!success) {
      this.error(`API operation failed: ${operation}`, context);
    }
  }

  // Merchant-specific logging
  logMerchantOperation(operation: string, merchantId: string, shop: string, success: boolean, duration?: number) {
    const context: LogContext = {
      merchantId,
      shop,
      operation,
      duration,
    };

    if (success) {
      this.info(`Merchant operation completed: ${operation}`, context);
    } else {
      this.error(`Merchant operation failed: ${operation}`, context);
    }
  }

  // Error logging with stack traces
  logError(error: Error, context?: LogContext) {
    this.error(error.message, {
      ...context,
      error,
      stack: error.stack,
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const logger = Logger.getInstance();

// Middleware for request logging
export function withRequestLogging<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (error) {
      logger.logError(error as Error, { operation: operationName });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      logger.trackPerformance(operationName, duration, success);
    }
  };
}

// Database operation wrapper with logging
export function withDatabaseLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: LogContext
): () => Promise<T> {
  return async () => {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.logError(error as Error, { ...context, operation: operationName });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation(operationName, duration, success, context);
    }
  };
}

// Health check endpoint data
export function getHealthMetrics() {
  const loggerInstance = Logger.getInstance();
  return {
    performanceMetrics: (loggerInstance as Logger).performanceMetrics?.length || 0,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
  };
} 