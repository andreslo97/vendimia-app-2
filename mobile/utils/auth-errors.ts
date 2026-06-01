export function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesion.";
  }

  return "No encontramos una cuenta con esos datos o la contraseña es incorrecta.";
}

export function getRegisterErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("already registered") || message.includes("already exists")) {
    return "Este correo ya esta registrado. Inicia sesion o usa otro correo.";
  }

  if (message.includes("password")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }

  if (message.includes("email")) {
    return "Revisa que el correo sea valido.";
  }

  return "No fue posible crear la cuenta. Intentalo nuevamente.";
}
