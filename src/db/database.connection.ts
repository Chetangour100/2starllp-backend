import mongoose from 'mongoose';
import { EnvironmentConfigValidator } from '../config/environment.config.js';
import { LogLevel } from '../enums/application.enum.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return mongoose;
    }

    try {
      const config = EnvironmentConfigValidator.validate(process.env);

      await mongoose.connect(
        config.MONGODB_URI,
        config.MONGODB_DB_NAME ? { dbName: config.MONGODB_DB_NAME } : undefined
      );

      this.isConnected = true;
      this.log(LogLevel.INFO, 'MongoDB connected successfully');

      mongoose.connection.on('error', (error) => {
        this.log(LogLevel.ERROR, `MongoDB connection error: ${error.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        this.log(LogLevel.WARN, 'MongoDB disconnected');
      });

      return mongoose;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(LogLevel.ERROR, `MongoDB connection failed: ${message}`);
      throw new Error(`MongoDB connection failed: ${message}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.log(LogLevel.INFO, 'MongoDB disconnected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(LogLevel.ERROR, `MongoDB disconnection failed: ${message}`);
      throw new Error(`MongoDB disconnection failed: ${message}`);
    }
  }

  public getConnection(): typeof mongoose {
    if (!this.isConnected || mongoose.connection.readyState !== 1) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return mongoose;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        return false;
      }
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(LogLevel.ERROR, `MongoDB health check failed: ${message}`);
      return false;
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [DatabaseConnection] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}
