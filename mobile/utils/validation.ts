/** Client-side checks mirroring the backend rules, for instant feedback. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8) return 'Use at least 8 characters';
  if (password.length > 128) return 'Use at most 128 characters';
  if (password.trim() !== password) return "Password can't start or end with a space";
  if (!/[A-Za-z]/.test(password)) return 'Include at least one letter';
  if (!/\d/.test(password)) return 'Include at least one number';
  return undefined;
}

export function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Enter your name';
  if (name.trim().length > 120) return 'Use at most 120 characters';
  return undefined;
}
