// Structured logging utility for production-grade observability
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogMetadata {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  userId?: string;
  message: string;
  metadata?: LogMetadata;
  stack?: string;
}

class Logger {
  private requestId?: string;
  private userId?: string;

  constructor(requestId?: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
  }

  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (this.requestId) entry.requestId = this.requestId;
    if (this.userId) entry.userId = this.userId;
    if (metadata && Object.keys(metadata).length > 0) entry.metadata = metadata;
    if (error?.stack) entry.stack = error.stack;

    return entry;
  }

  private log(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      default:
        console.log(logString);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log(this.formatLog(LogLevel.DEBUG, message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log(this.formatLog(LogLevel.INFO, message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log(this.formatLog(LogLevel.WARN, message, metadata));
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log(this.formatLog(LogLevel.ERROR, message, metadata, error));
  }

  // Create a child logger with the same context
  child(additionalContext: { requestId?: string; userId?: string }): Logger {
    return new Logger(
      additionalContext.requestId || this.requestId,
      additionalContext.userId || this.userId
    );
  }
}

// Factory function to create loggers with context
export const createLogger = (requestId?: string, userId?: string): Logger => {
  return new Logger(requestId, userId);
};

// Default logger for module-level logging
export const logger = new Logger();
