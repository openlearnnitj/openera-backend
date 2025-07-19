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
 * @swagger
 * /docs:
 *   get:
 *     summary: API Documentation (Swagger UI)
 *     description: Interactive API documentation using Swagger UI. This page allows you to explore all available endpoints, test them directly, and understand the API structure.
 *     tags: [Documentation]
 *     security: []
 *     responses:
 *       200:
 *         description: Swagger UI page loaded successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML page containing Swagger UI
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

/**
 * @swagger
 * /docs/json:
 *   get:
 *     summary: Raw OpenAPI JSON specification
 *     description: Returns the complete OpenAPI 3.0 specification in JSON format. This can be used to generate client SDKs or import into other API tools.
 *     tags: [Documentation]
 *     security: []
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Complete OpenAPI 3.0 specification
 *             example:
 *               openapi: "3.0.0"
 *               info:
 *                 title: "Open Era Hackathon API"
 *                 version: "1.0.0"
 *                 description: "Backend API for the Open Era Hackathon submission system"
 *               servers:
 *                 - url: "https://api.openera.openlearn.org.in"
 *                   description: "Production server"
 *               paths: {}
 *               components: {}
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /docs/yaml:
 *   get:
 *     summary: Raw OpenAPI YAML specification
 *     description: Returns the complete OpenAPI 3.0 specification in YAML format. This format is often preferred for version control and human readability.
 *     tags: [Documentation]
 *     security: []
 *     responses:
 *       200:
 *         description: OpenAPI specification in YAML format
 *         content:
 *           text/yaml:
 *             schema:
 *               type: string
 *               description: Complete OpenAPI 3.0 specification in YAML format
 *             example: |
 *               openapi: '3.0.0'
 *               info:
 *                 title: Open Era Hackathon API
 *                 version: '1.0.0'
 *                 description: Backend API for the Open Era Hackathon submission system
 *               servers:
 *                 - url: https://api.openera.openlearn.org.in
 *                   description: Production server
 *               paths: {}
 *               components: {}
 */
router.get('/yaml', (req, res) => {
  const yaml = require('js-yaml');
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(swaggerSpec));
});

export default router;
