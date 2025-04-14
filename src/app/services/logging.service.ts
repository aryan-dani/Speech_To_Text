import { Injectable } from '@angular/core';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private currentLogLevel: LogLevel = LogLevel.Info; // Default log level

  constructor() {}

  /**
   * Sets the current log level
   * @param level The log level to set
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Logs a debug message
   * @param message The message to log
   * @param data Optional data to log
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.Debug)) {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Logs an info message
   * @param message The message to log
   * @param data Optional data to log
   */
  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Logs a warning message
   * @param message The message to log
   * @param data Optional data to log
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Logs an error message
   * @param message The message to log
   * @param error Optional error to log
   */
  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(`[ERROR] ${message}`, error !== undefined ? error : '');
    }
  }

  /**
   * Determines if a message should be logged based on the current log level
   * @param level The log level of the message
   * @returns Whether the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  /**
   * Groups log messages for better console organization
   * @param groupName The name of the group
   * @param callback Function that contains logs to group
   */
  group(groupName: string, callback: () => void): void {
    console.group(groupName);
    callback();
    console.groupEnd();
  }

  /**
   * Creates readable error messages from various error types
   * @param error The error to format
   * @returns A human-readable error message
   */
  formatError(error: any): string {
    if (!error) {
      return 'Unknown error occurred';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error.status && error.statusText) {
      return `HTTP Error: ${error.status} ${error.statusText}`;
    }

    if (error.message) {
      return error.message;
    }

    return JSON.stringify(error);
  }
}
