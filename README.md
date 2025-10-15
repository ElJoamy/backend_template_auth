# Backend Template Auth - Typescrypt

Production-ready authentication API template built with Node.js, Express 5, and TypeScript. It provides user registration, login, logout, JWT-based access tokens, session persistence, and OpenAPI documentation.

## Features

- TypeScript-first Node.js API using `express@5`
- MySQL via TypeORM entities (auto-sync on startup)
- Secure password hashing with Argon2
- JWT generation and verification using `jose`
- Session tracking with `jti` and revocation on logout
- Structured logging to console and `logs/` using `winston`
- CORS configuration with "all" or restricted origins
- Swagger/OpenAPI docs at `/docs` and `/openapi.json`

## Tech Stack

- Runtime: `Node.js`
- Framework: `Express`
- Language: `TypeScript`
- ORM: `TypeORM`
- DB: `MySQL` (via `mysql2`)
- Auth: `jose` (JWT), `argon2`
- Docs: `swagger-jsdoc`, `swagger-ui-express`
- Logging: `winston`, `chalk`

## Prerequisites

- Node.js v18+ installed
- MySQL reachable with credentials defined in `.env`

## Getting Started

1. Clone the repository:
   - `git clone https://github.com/ElJoamy/backend_template_auth.git`
   - `cd backend_template_auth`

2. Copy the example environment file and edit values as needed:
   - `cp .env.example .env`
   - Update `DB_*`, `JWT_*`, `PORT`, and other values.

3. Install dependencies:
   - `npm install`

4. Run in development:
   - `npm run dev`

5. Build and run in production:
   - `npm run build`
   - `npm start`

The server listens on `http://localhost:<PORT>` (default `3000`).

## Configuration

Configure via `.env` (see `.env.example`):

- `SERVICE_NAME`: Display name (default: `Backend Template Auth - Typescrypt`)
- `VERSION`: Build/version label shown in docs
- `LOG_LEVEL`: `DEBUG`, `INFO`, `WARN`, `ERROR` (default `DEBUG`)
- `PORT`: Server port (default `3000`)

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`: MySQL settings
  - Database is created if missing
  - Tables are synchronized from TypeORM entities at startup

- `JWT_SECRET`: Strong secret; generate with `openssl rand -base64 32`
- `JWT_ALGORITHM`: e.g. `HS256`
- `JWT_EXPIRATION_MINUTES`: Access token TTL (default `60`)
- `JWT_REFRESH_EXPIRATION_MINUTES`: Refresh token TTL (currently unused by endpoints)
- `JWT_ISSUER`: Token issuer (defaults to `backend-template-auth-api` if not set)
- `JWT_AUDIENCE`: Token audience (defaults to `backend-template-auth-client` if not set)

- `ALLOWED_ORIGINS`: `all` or `limited`
  - When `limited`, update whitelist in `src/config/cors_config.ts`

## API Overview

- Base path: `http://localhost:3000`
- Health check: `GET /health` → `{ status: "ok" }`
- OpenAPI UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

Auth routes (mounted under `/api/v1/auth`):

1. `POST /api/v1/auth/register`
   - Body (JSON or `multipart/form-data`):
     - `name`, `lastname`, `username`, `email`, `phone`, `password`
   - Success `201`:
     ```json
     {
       "user": {
         "id": 1,
         "name": "John",
         "lastname": "Doe",
         "username": "johndoe",
         "email": "john@example.com",
         "phone": "600123456",
         "role": { "id": 2, "name": "MEMBER" }
       }
     }
     ```
   - Errors `400`: `{ "error": "message" }`

2. `POST /api/v1/auth/login`
   - Body (JSON or `multipart/form-data`):
     - Either `{ email, password }` or `{ username, password }`
   - Success `200`:
     ```json
     {
       "user_id": 1,
       "role_id": 2,
       "access_token": "<JWT>"
     }
     ```
   - Errors:
     - `401` invalid credentials: `{ "error": "message" }`
     - `409` active session exists: `{ "error": "message" }`

3. `POST /api/v1/auth/logout`
   - Header: `Authorization: Bearer <JWT>`
   - Success `200`: `{ "success": true }` (idempotent)

## Example Requests

Register:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "lastname": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "600123456",
    "password": "MyStr0ngPass!"
  }'
```

Login (email):
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "john@example.com", "password": "MyStr0ngPass!" }'
```

Logout:
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <JWT>"
```

## Folder Structure

```
src/
  config/
    cors_config.ts
    db_config.ts
    orm_config.ts
    settings.ts
    swagger.ts
  routes/
    api/
      v1/
        auth/
          index.ts
          login.ts
          logout.ts
          register.ts
        index.ts
  models/
    database/
      auth/
        base_model.ts
        user_model.ts
        role_model.ts
        session_model.ts
  services/
    auth/
      login_service.ts
      logout_service.ts
      register_service.ts
  repositories/
    auth/
      common_repository.ts
      login_repository.ts
      register_repository.ts
      session_repository.ts
  utils/
    jwt.ts
    logger.ts
    password_utils.ts
    validators.ts
  index.ts
```

## Notes & Tips

- The server creates the database (if missing) and syncs entities at startup.
- Use strong `JWT_SECRET` and review `JWT_ISSUER`/`JWT_AUDIENCE` for your environment.
- Set `ALLOWED_ORIGINS=limited` for production and update the whitelist.
- Logs are written to `logs/` per-file (e.g., `login_service.log`).

## Scripts

- `npm run dev` — Development with hot-reload
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run compiled server (`node dist/index.js`)

## Author

<table>
<tr>
    <td align="center">
        <a href="https://github.com/ElJoamy">
            <img src="https://avatars.githubusercontent.com/u/68487005?v=4" width="100;" alt="ElJoamy" style="border-radius: 50%;"/>
            <br />
            <sub><b>Joseph Anthony Meneses Salguero</b></sub>
        </a>
        <br />
        <a href="https://linkedin.com/in/joamy5902">
            <img src="https://img.shields.io/badge/-LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
        </a>
        <a href="https://github.com/ElJoamy">
            <img src="https://img.shields.io/badge/-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
        </a>
        <br />
        <sub>Bckend and AI Developer | Cybersecurity Engineer | DBA</sub>
    </td>
</tr>
</table>
