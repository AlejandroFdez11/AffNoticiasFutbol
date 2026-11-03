type ErrorWithCode = {
  code?: string;
  message?: string;
  status?: number;
};

function readError(error: unknown): ErrorWithCode {
  if (typeof error === 'object' && error !== null) {
    const value = error as ErrorWithCode;
    return {
      code: typeof value.code === 'string' ? value.code : undefined,
      message: typeof value.message === 'string' ? value.message : undefined,
      status: typeof value.status === 'number' ? value.status : undefined,
    };
  }

  return { message: typeof error === 'string' ? error : undefined };
}

/** Maps Supabase Auth errors to copy the user can act on. */
export function describeAuthError(error: unknown): string {
  const { code, message } = readError(error);
  const normalized = message?.toLowerCase() ?? '';

  switch (code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.';
    case 'weak_password':
      return 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
    case 'same_password':
      return 'La nueva contraseña debe ser distinta de la actual.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Has hecho demasiados intentos. Espera unos minutos y vuelve a probar.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'El enlace ha caducado. Solicita uno nuevo.';
    case 'provider_disabled':
      return 'Este método de acceso no está activado en Supabase.';
    case 'signup_disabled':
      return 'El registro está desactivado en Supabase.';
    case 'session_not_found':
      return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
    case 'validation_failed':
      return message ?? 'Revisa los datos del formulario.';
    default:
      break;
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.';
  }

  if (normalized.includes('user already registered')) {
    return 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.';
  }

  if (normalized.includes('network request failed') || normalized.includes('fetch')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  if (normalized.includes('redirect')) {
    return 'La URL de retorno no está permitida en Supabase. Revisa Authentication → URL Configuration.';
  }

  return message || 'No se pudo completar la operación. Inténtalo de nuevo.';
}

/** Maps profile table errors (RLS, missing table, duplicate username). */
export function describeProfileError(error: unknown): string {
  const { code, message } = readError(error);

  switch (code) {
    case '23505':
      return 'Ese nombre de usuario ya está en uso.';
    case '42P01':
      return 'Falta la tabla de perfiles. Ejecuta la migración de Supabase.';
    case '42501':
      return 'No tienes permiso para modificar este perfil.';
    default:
      break;
  }

  return message || 'No se pudo cargar tu perfil.';
}
