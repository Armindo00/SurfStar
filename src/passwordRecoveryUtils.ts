const RECOVERY_FLAG_KEY = 'surfstar-password-recovery'

export function isRecoveryHash(): boolean {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return false
  const params = new URLSearchParams(hash)
  return params.get('type') === 'recovery'
}

export function markPasswordRecoveryPending(): void {
  try {
    sessionStorage.setItem(RECOVERY_FLAG_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearPasswordRecoveryPending(): void {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG_KEY)
  } catch {
    /* ignore */
  }
}

export function isPasswordRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function navigateToResetPassword(): void {
  window.history.replaceState({}, '', '/reset-password')
}
