
import { useState, useCallback } from 'react';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  backoffFactor: number;
  maxDelay: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
};

export const useRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const finalConfig = { ...defaultConfig, ...config };
  
  const executeWithRetry = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    setIsRetrying(true);
    let lastError: Error;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        setRetryCount(attempt + 1);
        
        if (attempt < finalConfig.maxRetries) {
          const delay = Math.min(
            finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, attempt),
            finalConfig.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setIsRetrying(false);
    throw lastError!;
  }, [fn, finalConfig]);
  
  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);
  
  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    reset,
  };
};
