import { ValidationError } from '../../../utils/errors';
import { validateEmail, validateUsername } from '../../../utils/validators';

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  two_factor_token?: string;
}

export function parseLoginRequest(body: any): LoginRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo inválido.');
  }
  const { email, username, password, two_factor_token } = body;


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

  // Validar token 2FA si se proporciona
  let cleanTwoFactorToken: string | undefined = undefined;
  if (two_factor_token !== undefined) {
    if (typeof two_factor_token !== 'string' || !/^\d{6}$/.test(two_factor_token)) {
      throw new ValidationError('Token 2FA debe ser un código de 6 dígitos.');
    }
    cleanTwoFactorToken = two_factor_token;
  }

  return { 
    email: cleanEmail, 
    username: cleanUsername, 
    password,
    two_factor_token: cleanTwoFactorToken
  };
}