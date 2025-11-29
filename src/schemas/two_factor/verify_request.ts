import { ValidationError } from '../../utils/errors';

export interface TwoFactorVerifyRequest {
  token: string;
}

export function parseTwoFactorVerifyRequest(rawBody: any): TwoFactorVerifyRequest {
  if (!rawBody || typeof rawBody !== 'object') {
    throw new ValidationError('Cuerpo de solicitud inválido.', 400);
  }

  const { token } = rawBody;

  if (!token || typeof token !== 'string') {
    throw new ValidationError('El token es requerido y debe ser una cadena.', 400);
  }

  // Validar que el token sea numérico y tenga 6 dígitos (formato TOTP estándar)
  if (!/^\d{6}$/.test(token)) {
    throw new ValidationError('El token debe ser un código de 6 dígitos.', 400);
  }

  return { token };
}