import pRetry from "p-retry";

export interface RetryOptions {
  retries?: number; // max retry attempts (defaults to 5)
  factor?: number; // back-off multiplier (defaults to 2)
  minTimeout?: number; // initial delay in ms (defaults to 1000)
  maxTimeout?: number; // max delay cap in ms (defaults to 30000)
}

/**
 * Wraps a method so that if it throws, it'll be retried with exponential back-off.
 *
 * @example
 * @Retryable({ retries: 3, minTimeout: 500, factor: 2 })
 * async doWork() { … }
 */
export function Retryable(opts: RetryOptions = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return pRetry(() => originalMethod.apply(this, args), {
        retries: opts.retries ?? 5,
        factor: opts.factor ?? 2,
        minTimeout: opts.minTimeout ?? 1000,
        maxTimeout: opts.maxTimeout ?? 30_000,
      });
    };
  };
}
