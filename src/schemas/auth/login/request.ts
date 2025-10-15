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

  // Soportar clientes que envían mal el campo: si viene 'email' pero no es email,
  // intentamos usarlo como username; y viceversa.
  const emailRaw = typeof email === 'string' ? email : undefined;
  const usernameRaw = typeof username === 'string' ? username : undefined;

  let cleanEmail: string | undefined = undefined;
  let cleanUsername: string | undefined = undefined;

  if (emailRaw) {
    try {
      cleanEmail = validateEmail(emailRaw);
    } catch {
      // Fallback: tratar el valor de 'email' como username si no se proveyó 'username'
      if (!usernameRaw) {
        try {
          cleanUsername = validateUsername(emailRaw);
        } catch {
          // ignorar; se manejará más abajo
        }
      }
    }
  }
  if (usernameRaw) {
    try {
      cleanUsername = validateUsername(usernameRaw);
    } catch {
      // Fallback: tratar el valor de 'username' como email si no se proveyó 'email'
      if (!emailRaw) {
        try {
          cleanEmail = validateEmail(usernameRaw);
        } catch {
          // ignorar; se manejará más abajo
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