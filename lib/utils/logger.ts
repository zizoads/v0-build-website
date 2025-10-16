/**
 * Logging Utility
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

class Logger {
  private logFile: string[] = [];
  private maxLogSize = 1000;

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message);
    
    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARNING:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
    }

    // Store in memory
    this.logFile.push(formattedMessage);
    if (this.logFile.length > this.maxLogSize) {
      this.logFile.shift();
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warning(message: string, data?: any): void {
    this.log(LogLevel.WARNING, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  getLogs(): string[] {
    return [...this.logFile];
  }

  clearLogs(): void {
    this.logFile = [];
  }
}

export const logger = new Logger();