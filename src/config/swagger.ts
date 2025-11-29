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
    { name: 'Profile', description: 'User profile endpoints' },
    { name: 'Two Factor Authentication', description: '2FA endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key personal (enviado en header X-API-Key)'
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
              two_factor_token: { 
                type: 'string', 
                pattern: '^\\d{6}$',
                description: 'Optional 2FA token (6 digits). Required if 2FA is enabled for the user.' 
              },
            },
          },
          {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string', description: 'Username (3-20, letters/numbers/._-)' },
              password: { type: 'string', minLength: 8, description: 'User password (minimum 8 characters)' },
              two_factor_token: { 
                type: 'string', 
                pattern: '^\\d{6}$',
                description: 'Optional 2FA token (6 digits). Required if 2FA is enabled for the user.' 
              },
            },
          },
        ],
        description: 'Provide email or username along with password. Include two_factor_token if 2FA is enabled for the user.',
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Client-readable error message' },
        },
      },
      AvatarType: {
        type: 'string',
        enum: ['jpg', 'jpeg', 'png', 'heic', 'heif'],
        description: 'Accepted avatar image types',
      },
      Profile: {
        type: 'object',
        required: ['id', 'name', 'lastname', 'username', 'email', 'role'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          lastname: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          avatar_type: { $ref: '#/components/schemas/AvatarType', nullable: true },
          role: {
            type: 'object',
            properties: {
              id: { type: 'integer', nullable: true },
              name: { type: 'string', nullable: true, enum: Object.values(RoleName) },
            },
          },
        },
      },
      GetProfileResponse: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/Profile' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          lastname: { type: 'string', minLength: 2 },
          username: { type: 'string', description: '3-20 characters; letters, numbers, . _ -' },
          phone: { type: 'string', nullable: true, description: 'Optional; 6-15 digits, no spaces or symbols' },
          avatar: { 
            type: 'string', 
            format: 'binary', 
            description: 'Archivo de imagen del avatar (solo multipart). El tipo se detecta automáticamente; se rechaza si no es jpg/jpeg/png/heic/heif.' 
          },
        },
        description: 'Permite actualizaciones parciales del perfil. Use multipart/form-data para subir el avatar. No envíe avatar_type: el servidor detecta y valida el tipo automáticamente.',
      },
      UpdateProfileResponse: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/Profile' },
        },
      },
      PersonalTokenExpiryPreset: {
        type: 'string',
        enum: ['1_week', '1_month', '3_months', '6_months', '1_year'],
        description: 'Preset de expiración para tokens personales (default recomendado: 3 meses)'
      },
      PersonalTokenCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Etiqueta opcional para el token' },
          expires_preset: {
            $ref: '#/components/schemas/PersonalTokenExpiryPreset'
          },
        },
        description: 'Cuerpo para creación de token personal (JSON o multipart)'
      },
      PersonalTokenCreateResponse: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'Token personal en texto claro (solo se muestra una vez)' },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { apiKeyAuth: [] },
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