import { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/jwt';
import { getActiveSessionByJti } from '../repositories/auth/session_repository';
import { listActivePersonalTokens } from '../repositories/auth/personal_token_repository';
import argon2 from 'argon2';

// Middleware simple para requerir autenticación y adjuntar userId al request
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const payload = await decodeToken(token);
      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'No autorizado: token inválido' });
      }
      (req as any).userId = Number(payload.sub);
      (req as any).twoFactorPending = payload.two_factor_pending === true;
      (req as any).authByApiKey = false;
      (req as any).jti = payload.jti;
      // Validar que la sesión asociada al jti esté activa (no revocada y no expirada)
      if (payload.jti) {
        const active = await getActiveSessionByJti(String(payload.jti));
        if (!active) {
          return res.status(401).json({ error: 'No autorizado: sesión revocada o expirada' });
        }
      }
      if ((req as any).twoFactorPending) {
        return res.status(403).json({ error: 'Acceso restringido: requiere verificación 2FA' });
      }
      return next();
    }

    // Alternativa: autenticación por API Key en header X-API-Key
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKey = typeof apiKeyHeader === 'string' ? apiKeyHeader : Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : '';
    if (apiKey && apiKey.length >= 20) {
      const active = await listActivePersonalTokens();
      for (const t of active) {
        if (await argon2.verify(t.token_hash, apiKey)) {
          (req as any).userId = Number(t.user_id);
          (req as any).twoFactorPending = false;
          (req as any).authByApiKey = true;
          return next();
        }
      }
      return res.status(401).json({ error: 'No autorizado: API Key inválida o revocada' });
    }

    return res.status(401).json({ error: 'No autorizado: falta Bearer o API Key' });
  } catch (e: any) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}

// Variante del middleware que permite tokens con two_factor_pending=true.
// Úsese solo para completar el login 2FA.
export async function requireAuthAllowPending(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const payload = await decodeToken(token);
      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'No autorizado: token inválido' });
      }
      (req as any).userId = Number(payload.sub);
      (req as any).twoFactorPending = payload.two_factor_pending === true;
      (req as any).authByApiKey = false;
      (req as any).jti = payload.jti;
      // Validar que la sesión exista y no esté revocada (permitimos two_factor_pending)
      if (payload.jti) {
        const active = await getActiveSessionByJti(String(payload.jti));
        if (!active) {
          return res.status(401).json({ error: 'No autorizado: sesión revocada o expirada' });
        }
      }
      return next();
    }

    // También permitir API Key (aunque usualmente no aplica para este flujo)
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKey = typeof apiKeyHeader === 'string' ? apiKeyHeader : Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : '';
    if (apiKey && apiKey.length >= 20) {
      const active = await listActivePersonalTokens();
      for (const t of active) {
        if (await argon2.verify(t.token_hash, apiKey)) {
          (req as any).userId = Number(t.user_id);
          (req as any).twoFactorPending = false;
          (req as any).authByApiKey = true;
          return next();
        }
      }
      return res.status(401).json({ error: 'No autorizado: API Key inválida o revocada' });
    }

    return res.status(401).json({ error: 'No autorizado: falta Bearer o API Key' });
  } catch (e: any) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}

// Middleware que exige exclusivamente Authorization: Bearer y bloquea API Key.
export async function requireBearerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const payload = await decodeToken(token);
      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'No autorizado: token inválido' });
      }
      (req as any).userId = Number(payload.sub);
      (req as any).twoFactorPending = payload.two_factor_pending === true;
      (req as any).authByApiKey = false;
      (req as any).jti = payload.jti;
      if (payload.jti) {
        const active = await getActiveSessionByJti(String(payload.jti));
        if (!active) {
          return res.status(401).json({ error: 'No autorizado: sesión revocada o expirada' });
        }
      }
      if ((req as any).twoFactorPending) {
        return res.status(403).json({ error: 'Acceso restringido: requiere verificación 2FA' });
      }
      return next();
    }
    return res.status(401).json({ error: 'No autorizado: se requiere Bearer' });
  } catch (e: any) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}

// Variante Bearer que permite two_factor_pending=true, sin permitir API Key.
export async function requireBearerAuthAllowPending(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const payload = await decodeToken(token);
      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'No autorizado: token inválido' });
      }
      (req as any).userId = Number(payload.sub);
      (req as any).twoFactorPending = payload.two_factor_pending === true;
      (req as any).authByApiKey = false;
      (req as any).jti = payload.jti;
      if (payload.jti) {
        const active = await getActiveSessionByJti(String(payload.jti));
        if (!active) {
          return res.status(401).json({ error: 'No autorizado: sesión revocada o expirada' });
        }
      }
      return next();
    }
    return res.status(401).json({ error: 'No autorizado: se requiere Bearer' });
  } catch (e: any) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}