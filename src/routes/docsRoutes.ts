import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = Router();

// Swagger UI setup options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; }
  `,
  customSiteTitle: 'Open Era API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

/**
 * @route GET /docs
 * @desc API Documentation (Swagger UI)
 * @access Public
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

/**
 * @route GET /docs/json
 * @desc Raw OpenAPI JSON specification
 * @access Public
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @route GET /docs/yaml
 * @desc Raw OpenAPI YAML specification
 * @access Public
 */
router.get('/yaml', (req, res) => {
  const yaml = require('js-yaml');
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(swaggerSpec));
});

export default router;
