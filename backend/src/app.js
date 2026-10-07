const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openApiDocument = require('../docs/openapi.json');
const logger = require('./config/logger');
const prisma = require('./lib/prisma');
const LisensiRepository = require('./repositories/lisensi.repository');
const LisensiService = require('./services/lisensi.service');
const LisensiController = require('./controllers/lisensi.controller');
const UserRepository = require('./repositories/user.repository');
const AuthService = require('./services/auth.service');
const AuthController = require('./controllers/auth.controller');
const createLisensiRouter = require('./routes/lisensi.routes');
const createAuthRouter = require('./routes/auth.routes');
const authenticate = require('./middlewares/authenticate');
const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');

function createApp({ database = prisma } = {}) {
  const app = express();
  const repository = new LisensiRepository(database);
  const service = new LisensiService(repository);
  const controller = new LisensiController(service);
  const userRepository = new UserRepository(database);
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.http('HTTP request', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      });
    });
    next();
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'License Addon Bank API Docs',
    explorer: true
  }));
  app.get('/openapi.json', (req, res) => res.json(openApiDocument));
  app.use(createAuthRouter(authController));
  app.use(createLisensiRouter(controller, authenticate));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
