const { createApp } = require('./app');
const { initDatabase, closeDatabase } = require('./db');
const { logger } = require('./logger');

const PORT = process.env.PORT || 3001;

initDatabase();
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info('CookieClicker API started', {
    url: `http://localhost:${PORT}`,
    swagger: `http://localhost:${PORT}/api-docs`,
    env: process.env.NODE_ENV || 'development'
  });
});

function shutdown(signal) {
  logger.info('Shutting down server', { signal });
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
