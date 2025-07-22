import winston from 'winston';
import path from 'path';
import { ServerConfig } from '@types';

const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_LOG_FORMAT = 'json';

export function createLogger(
  name: string,
  config?: ServerConfig['logging']
): winston.Logger {
  const logConfig = config || {
    level: DEFAULT_LOG_LEVEL,
    format: DEFAULT_LOG_FORMAT,
    outputPath: './logs',
  };

  const formats = [];
  
  formats.push(winston.format.timestamp());
  formats.push(winston.format.errors({ stack: true }));
  
  if (logConfig.format === 'json') {
    formats.push(winston.format.json());
  } else {
    formats.push(winston.format.simple());
  }

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${name}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ];

  if (logConfig.outputPath) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logConfig.outputPath, `${name}-error.log`),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logConfig.outputPath, `${name}-combined.log`),
      })
    );
  }

  return winston.createLogger({
    level: logConfig.level,
    format: winston.format.combine(...formats),
    transports,
    defaultMeta: { service: name },
  });
}

export class LoggerFactory {
  private static loggers = new Map<string, winston.Logger>();
  private static config?: ServerConfig['logging'];

  static configure(config: ServerConfig['logging']): void {
    this.config = config;
  }

  static getLogger(name: string): winston.Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, createLogger(name, this.config));
    }
    return this.loggers.get(name)!;
  }

  static clearLoggers(): void {
    this.loggers.clear();
  }
}