/**
 * Development Logger Utility
 * 
 * Provides console logging that only works in development mode.
 * In production builds, all log statements become no-ops.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (always shown, even in production, but can be controlled)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you might want to send errors to a logging service instead
    // Example: sendToErrorTracking(...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
