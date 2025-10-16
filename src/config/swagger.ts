import swaggerJSDoc, { OAS3Definition, OAS3Options } from 'swagger-jsdoc';
import { getAppSettings, type AppSettings } from './settings';
import { RoleName } from '../schemas/roles';

const appSettings: AppSettings = getAppSettings();

const swaggerDefinition: OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: appSettings.service_name,
    version: appSettings.version,
    description: 'OpenAPI documentation for Backend Template Auth - Typescrypt',
  },
  servers: [
    { url: `http://localhost:${appSettings.port}`, description: 'Local server' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      PublicUser: {
        type: 'object',
        required: ['id', 'name', 'lastname', 'username', 'email', 'role'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          lastname: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true, description: 'Optional phone number (6-15 digits)' },
          role: {
            type: 'object',
            properties: {
              id: { type: 'integer', nullable: true },
              name: { type: 'string', nullable: true, enum: Object.values(RoleName) },
            },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['user_id', 'role_id', 'access_token'],
        properties: {
          user_id: { type: 'integer', description: 'Authenticated user ID' },
          role_id: { type: 'integer', nullable: true, description: 'Role ID or null if not applicable' },
          access_token: {
            type: 'string',
            description: 'Access JWT. Use in Authorization: Bearer <token>. Includes jti and exp.',
          },
        },
      },
      LogoutResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', description: 'true if the request was processed. If token is valid, session is revoked.' },
        },
      },
      RegisterResponse: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/PublicUser' },
        },
        example: {
          user: {
            id: 7,
            name: 'John',
            lastname: 'Doe',
            username: 'johndoe2',
            email: 'john2@example.com',
            phone: '65656565',
            role: { id: 4, name: 'guest' },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'lastname', 'username', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, description: 'User first name (minimum 2 characters)' },
          lastname: { type: 'string', minLength: 2, description: 'User last name (minimum 2 characters)' },
          username: { type: 'string', description: '3-20 characters; letters, numbers, . _ -' },
          email: { type: 'string', format: 'email', description: 'Valid email address' },
          phone: { type: 'string', nullable: true, description: 'Optional; 6-15 digits, no spaces or symbols' },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Minimum 8; must include uppercase, lowercase, number and symbol; no sequential digits',
          },
        },
        description: 'Al registrarse, el usuario se crea con rol por defecto guest.',
      },
      LoginRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', description: 'User email. Alternatively, send username.' },
              password: { type: 'string', minLength: 8, description: 'User password (minimum 8 characters)' },
            },
          },
          {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string', description: 'Username (3-20, letters/numbers/._-)' },
              password: { type: 'string', minLength: 8, description: 'User password (minimum 8 characters)' },
            },
          },
        ],
        description: 'Provide email or username along with password. If client sends "email" with a username value, backend treats it as username.',
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Client-readable error message' },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
};

const options: OAS3Options = {
  definition: swaggerDefinition,
  apis: [
    'src/routes/**/*.ts',
    'src/schemas/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);