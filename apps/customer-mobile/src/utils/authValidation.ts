export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export function getPasswordRequirements(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password),
  };
}
