import { ValidationError } from '../../utils/errors';
import { validatePasswordStrength } from '../../utils/validators';

export interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
}

export function parsePasswordUpdateRequest(body: any): PasswordUpdateRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const current_password = typeof body.current_password === 'string' ? body.current_password : '';
  const new_password = typeof body.new_password === 'string' ? body.new_password : '';

  if (!current_password || current_password.length < 8) {
    throw new ValidationError('Password actual inválida (mínimo 8 caracteres).');
  }
  validatePasswordStrength(new_password);

  return { current_password, new_password };
}