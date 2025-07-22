#!/usr/bin/env node

import { MCPServer } from '@core/MCPServer';
import { LoggerFactory } from '@utils/logger';

const logger = LoggerFactory.getLogger('Main');

async function main() {
  logger.info('Starting MCP Development Workflow Server...');
  
  const server = new MCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });
  
  try {
    await server.initialize();
    logger.info('MCP Development Workflow Server is running');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});