import swaggerJSDoc, { OAS3Definition, OAS3Options } from 'swagger-jsdoc';
import { getAppSettings, type AppSettings } from './settings';

const appSettings: AppSettings = getAppSettings();

const swaggerDefinition: OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: appSettings.service_name,
    version: appSettings.version,
    description: 'Documentación OpenAPI de Backend Template Auth - Typescrypt',
  },
  servers: [
    { url: `http://localhost:${appSettings.port}`, description: 'Servidor local' },
  ],
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticación' },
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
        required: ['id', 'name', 'lastname', 'username', 'email', 'phone', 'role'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          lastname: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: {
            type: 'object',
            properties: {
              id: { type: 'integer', nullable: true },
              name: { type: 'string', nullable: true },
            },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['user_id', 'role_id', 'access_token'],
        properties: {
          user_id: { type: 'integer', description: 'ID del usuario autenticado' },
          role_id: { type: 'integer', nullable: true, description: 'ID del rol o null si no aplica' },
          access_token: {
            type: 'string',
            description: 'JWT de acceso. Usar en Authorization: Bearer <token>. Incluye jti y exp.',
          },
        },
      },
      LogoutResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', description: 'true si la petición se procesó. Si el token es válido, revoca la sesión.' },
        },
      },
      RegisterResponse: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/PublicUser' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'lastname', 'username', 'email', 'phone', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, description: 'Nombre del usuario (mínimo 2 caracteres)' },
          lastname: { type: 'string', minLength: 2, description: 'Apellido del usuario (mínimo 2 caracteres)' },
          username: { type: 'string', description: '3-20 caracteres; letras, números, . _ -' },
          email: { type: 'string', format: 'email', description: 'Correo electrónico válido' },
          phone: { type: 'string', description: 'Teléfono 6-15 dígitos' },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Mínimo 8; debe incluir mayúscula, minúscula, número y símbolo; sin dígitos secuenciales',
          },
        },
      },
      LoginRequest: {
        oneOf: [
          {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', description: 'Correo del usuario. Alternativamente, envía username.' },
              password: { type: 'string', minLength: 8, description: 'Contraseña del usuario (mínimo 8 caracteres)' },
            },
          },
          {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string', description: 'Nombre de usuario (3-20, letras/números/._-)' },
              password: { type: 'string', minLength: 8, description: 'Contraseña del usuario (mínimo 8 caracteres)' },
            },
          },
        ],
        description: 'Proveer email o username junto con password. Si el cliente envía "email" con un username, el backend lo tratará como username.',
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Mensaje de error legible para el cliente' },
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