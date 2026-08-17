export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SIGN_IN_FAILED: 'SIGN_IN_FAILED',
} as const

const TECHNICAL_ERROR_PATTERN = /supabase|authentication\s*→|\.sql|fix-missing-profiles/i

export function resolveAuthErrorMessage(
  error: string | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (!error || error === AUTH_ERROR_CODES.SIGN_IN_FAILED) {
    return t('errors.signInFailed')
  }
  if (error === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
    return t('errors.invalidCredentials')
  }
  if (TECHNICAL_ERROR_PATTERN.test(error)) {
    return t('errors.signInFailed')
  }
  return error
}
