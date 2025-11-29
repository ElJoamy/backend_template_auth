import { ValidationError } from '../../../utils/errors';

export interface TokenLoginRequest {
  token: string;
}

export function parseTokenLoginRequest(body: any): TokenLoginRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const { token } = body;
  if (!token || typeof token !== 'string' || token.length < 20) {
    throw new ValidationError('Token inválido.');
  }
  return { token };
}