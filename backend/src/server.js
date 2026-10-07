const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./lib/prisma');
const createApp = require('./app');

const app = createApp();
const server = app.listen(env.port, () => {
  logger.info(`Server berjalan di port ${env.port}`);
});

async function shutdown(signal) {
  logger.info(`Menerima ${signal}, menghentikan server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
