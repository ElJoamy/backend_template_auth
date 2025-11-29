import { ValidationError } from '../../utils/errors';

export interface TwoFactorSetupRequest {
  // No hay campos requeridos - issuer y label se generan automáticamente
}

export function parseTwoFactorSetupRequest(rawBody: any): TwoFactorSetupRequest {
  // Permitir cuerpo vacío o null
  if (rawBody === null || rawBody === undefined) {
    return {};
  }

  if (typeof rawBody !== 'object') {
    throw new ValidationError('Cuerpo de solicitud inválido.', 400);
  }

  // Retornar objeto vacío ya que no procesamos campos del usuario
  return {};
}