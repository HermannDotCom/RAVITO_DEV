/**
 * Structured Logging Service
 * Provides correlation IDs and structured logging for request tracing
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  stack?: string;
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

class Logger {
  private correlationId: string;
  private userId?: string;
  private environment: string;

  constructor() {
    this.correlationId = generateCorrelationId();
    this.environment = import.meta.env.MODE || 'development';
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Set user ID for logging context
   */
  setUserId(id: string) {
    this.userId = id;
  }

  /**
   * Clear user ID
   */
  clearUserId() {
    this.userId = undefined;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      userId: this.userId,
      context,
    };
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Send log to aggregation service
   */
  private async sendToAggregator(entry: LogEntry) {
    // In production, send to centralized logging service
    if (this.environment === 'production') {
      try {
        // Example: Send to Supabase logging table or external service
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   body: JSON.stringify(entry),
        // });
      } catch (error) {
        console.error('Failed to send log to aggregator:', error);
      }
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('debug', message, context);
    if (this.environment === 'development') {
      console.debug(this.formatLog(entry));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('info', message, context);
    console.info(this.formatLog(entry));
    this.sendToAggregator(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('warn', message, context);
    console.warn(this.formatLog(entry));
    this.sendToAggregator(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    console.error(this.formatLog(entry));
    this.sendToAggregator(entry);
  }

  /**
   * Critical level logging (requires immediate attention)
   */
  critical(message: string, error?: Error, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('critical', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    console.error(this.formatLog(entry));
    this.sendToAggregator(entry);
  }

  /**
   * Create a new logger instance with fresh correlation ID
   */
  createChildLogger(): Logger {
    const child = new Logger();
    child.setUserId(this.userId || '');
    return child;
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
