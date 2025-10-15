import { ValidationError } from '../../../utils/errors';
import { validateEmail, validateUsername } from '../../../utils/validators';

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export function parseLoginRequest(body: any): LoginRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const { email, username, password } = body;


  const emailRaw = typeof email === 'string' ? email : undefined;
  const usernameRaw = typeof username === 'string' ? username : undefined;

  let cleanEmail: string | undefined = undefined;
  let cleanUsername: string | undefined = undefined;

  if (emailRaw) {
    try {
      cleanEmail = validateEmail(emailRaw);
    } catch {
      if (!usernameRaw) {
        try {
          cleanUsername = validateUsername(emailRaw);
        } catch {
        }
      }
    }
  }
  if (usernameRaw) {
    try {
      cleanUsername = validateUsername(usernameRaw);
    } catch {
      if (!emailRaw) {
        try {
          cleanEmail = validateEmail(usernameRaw);
        } catch {
        }
      }
    }
  }

  if (!cleanEmail && !cleanUsername) {
    throw new ValidationError('Provee email o username válido.');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ValidationError('Password inválida (mínimo 8 caracteres).');
  }
  return { email: cleanEmail, username: cleanUsername, password };
}