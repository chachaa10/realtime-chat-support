export interface PasswordRule {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'lowercase', label: 'At least one lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'uppercase', label: 'At least one uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'At least one number', test: (v) => /[0-9]/.test(v) },
];

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
