import { NextResponse } from 'next/server';

export interface ErrorWithCode extends Error {
  code?: string;
  statusCode?: number;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`Database error: ${message}`, 503);
    this.name = 'DatabaseError';
    // Store original error in a custom property
    if (originalError) {
      (this as any).originalError = originalError;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(`Validation error: ${message}`, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

// Retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation or auth errors
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError || 
          error instanceof AuthorizationError) {
        throw error;
      }

      // Log retry attempts
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new DatabaseError(`Operation failed after ${maxRetries} attempts`, lastError!);
}

// Error response helper
export function createErrorResponse(error: Error | string, statusCode: number = 500) {
  const message = typeof error === 'string' ? error : error.message;
  const isOperational = error instanceof AppError ? error.isOperational : true;
  
  console.error(`API Error (${statusCode}):`, {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    isOperational,
  });

  return NextResponse.json(
    { 
      error: message,
      success: false,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// Success response helper
export function createSuccessResponse(data: any, statusCode: number = 200) {
  return NextResponse.json(
    { 
      data,
      success: true,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// Global error handler for async operations
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Unhandled error in operation:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Convert unknown errors to operational errors
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        false
      );
    }
  };
}

// Database operation wrapper with retry
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  return withRetry(
    async () => {
      try {
        return await operation();
      } catch (error) {
        // Log database-specific errors
        console.error(`Database error in ${context}:`, error);
        throw new DatabaseError(`Failed to execute ${context}`, error as Error);
      }
    },
    3, // maxRetries
    1000 // initial delay
  );
} 