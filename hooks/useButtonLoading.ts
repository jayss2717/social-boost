import { useState, useCallback } from 'react';

interface UseButtonLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R>;
}

export function useButtonLoading(): UseButtonLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      startLoading();
      try {
        const result = await fn(...args);
        return result;
      } finally {
        stopLoading();
      }
    };
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
} 