import { ValidationError } from '../../utils/errors';
import { validateUsername, validatePhoneNumber } from '../../utils/validators';
import { ImageType } from '../media/image_types';

export interface UpdateProfileRequest {
  name?: string;
  lastname?: string;
  username?: string;
  phone?: string | null;
  avatar_type?: ImageType;
}

export function parseUpdateProfileRequest(body: any): UpdateProfileRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const { name, lastname, username, phone } = body;

  const result: UpdateProfileRequest = {};

  if (typeof name === 'string') {
    const cleaned = name.trim();
    if (cleaned.length > 0) {
      if (cleaned.length < 2) throw new ValidationError('Nombre inválido (mínimo 2 caracteres).');
      result.name = cleaned;
    }
  }
  if (typeof lastname === 'string') {
    const cleaned = lastname.trim();
    if (cleaned.length > 0) {
      if (cleaned.length < 2) throw new ValidationError('Apellido inválido (mínimo 2 caracteres).');
      result.lastname = cleaned;
    }
  }
  if (typeof username === 'string') {
    const cleaned = username.trim();
    if (cleaned.length > 0) {
      result.username = validateUsername(cleaned);
    }
  }
  if (typeof phone === 'string') {
    const cleaned = phone.trim();
    if (cleaned.length > 0) {
      result.phone = validatePhoneNumber(cleaned);
    }
  } else if (phone === null) {
    result.phone = null;
  }

  // Ya no forzamos tener al menos un campo aquí porque
  // puede venir solamente el archivo del avatar en multipart.
  // El servicio validará si no hay cambios ni archivo.

  return result;
}