import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { SwaggerConfig } from './api-documentation/swagger.config.js';
import { EnvironmentConfigValidator } from './config/environment.config.js';
import { DatabaseConnection } from './db/database.connection.js';

import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';

import routes from './routes/index.js';

async function bootstrap(): Promise<void> {
  const config = EnvironmentConfigValidator.validate(
    process.env
  );

  const app = express();

  // =====================================================
  // MIDDLEWARES
  // =====================================================

  app.use(cors());

  app.use(express.json());

  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  // =====================================================
  // SERVER URL
  // =====================================================

  const baseUrl = `http://localhost:${config.PORT}`;

  // =====================================================
  // SWAGGER
  // IMPORTANT:
  // API routes are mounted under /api
  // =====================================================

  const swaggerBaseUrl = `${baseUrl}/api`;

  const swaggerSpec = swaggerJsdoc(
    SwaggerConfig.createOptions(
      swaggerBaseUrl
    )
  );

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerSpec,
      SwaggerConfig.createUIOptions()
    )
  );

  // =====================================================
  // API ROUTES
  // =====================================================

  app.use('/api', routes);

  // =====================================================
  // ERROR HANDLERS
  // =====================================================

  app.use(notFoundHandler);

  app.use(errorHandler);

  // =====================================================
  // DATABASE CONNECTION
  // =====================================================

  await DatabaseConnection
    .getInstance()
    .connect();

  // =====================================================
  // START SERVER
  // =====================================================

  app.listen(config.PORT, () => {
    console.info(
      `Server running on ${baseUrl}`
    );

    console.info(
      `API Base URL: ${baseUrl}/api`
    );

    console.info(
      `Swagger docs: ${baseUrl}/api-docs`
    );
  });
}

// =====================================================
// BOOTSTRAP
// =====================================================

bootstrap().catch((error) => {
  console.error(
    'Failed to start server:',
    error
  );

  process.exit(1);
});