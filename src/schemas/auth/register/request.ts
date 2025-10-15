import { ValidationError } from '../../../utils/errors';
import { validateEmail, validateUsername, validatePhoneNumber, validatePasswordStrength } from '../../../utils/validators';

export interface RegisterRequest {
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export function parseRegisterRequest(body: any): RegisterRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const { name, lastname, username, email, phone, password } = body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ValidationError('Nombre inválido.');
  }
  if (!lastname || typeof lastname !== 'string' || lastname.trim().length < 2) {
    throw new ValidationError('Apellido inválido.');
  }
  const cleanUsername = validateUsername(username);
  const cleanEmail = validateEmail(email);
  const cleanPhone = validatePhoneNumber(phone);
  validatePasswordStrength(password);

  return {
    name: name.trim(),
    lastname: lastname.trim(),
    username: cleanUsername,
    email: cleanEmail,
    phone: cleanPhone,
    password,
  };
}