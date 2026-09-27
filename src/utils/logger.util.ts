import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private format(level: LogLevel, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  info(message: string, meta?: unknown) {
    console.log(this.format('info', message, meta));
  }

  warn(message: string, meta?: unknown) {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: unknown) {
    console.error(this.format('error', message, meta));
  }

  debug(message: string, meta?: unknown) {
    if (env.NODE_ENV === 'development') {
      console.debug(this.format('debug', message, meta));
    }
  }
}

export const logger = new Logger();
