import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger.util';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // 1. Verify Database Connection
    await prisma.$connect();
    logger.info('🐘 Database connected successfully via Prisma');

    // 2. Start HTTP Server
    const server = app.listen(PORT, () => {
      logger.info('==================================================');
      logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port: ${PORT}`);
      logger.info(`🌐 Base API URL:       ${env.APP_URL}${env.API_PREFIX}`);
      logger.info(`📚 Swagger Docs:       ${env.APP_URL}/api-docs`);
      logger.info(`🩺 Health Check:       ${env.APP_URL}${env.API_PREFIX}/health`);
      logger.info('==================================================');
    });

    // 3. Graceful Shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        logger.info('HTTP Server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if hanging
      setTimeout(() => {
        logger.error('Forceful shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
