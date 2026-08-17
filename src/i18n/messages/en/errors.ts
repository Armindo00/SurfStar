export const errors = {
  generic: 'Something went wrong. Please try again.',
  signInFailed: 'Sign in failed.',
  invalidCredentials:
    'Incorrect email or password. Check your details or use "Forgot password?" to reset it.',
  signInConnection: 'Sign in failed. Check your connection and try again.',
  createAccountFailed: 'Could not create account.',
  updateRequestFailed: 'Could not update request.',
  leaveCoachFailed: 'Could not leave coach.',
  sendResetCodeFailed: 'Could not send reset code.',
  resendCodeFailed: 'Could not resend code.',
  invalidOrExpiredCode: 'Invalid or expired code.',
  unknownError: 'An unexpected error occurred.',
  loadFailed: 'Failed to load data.',
  saveFailed: 'Failed to save changes.',
  deleteFailed: 'Failed to delete.',
  networkError: 'Network error. Check your connection.',
} as const
