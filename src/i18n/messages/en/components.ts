export const components = {
  cookieConsent: {
    ariaLabel: 'Cookie notice',
    text: 'We use essential cookies and local storage to keep you signed in and save session progress. We do not use advertising cookies. See our',
    privacyPolicy: 'Privacy Policy',
    complaintsBook: 'Livro de reclamações',
    accept: 'Accept',
  },
  legalFooter: {
    ariaLabel: 'Legal',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    complaintsBook: 'Livro de reclamações',
  },
  endSessionSheet: {
    eyebrow: 'Finish session',
    title: 'Session notes',
    intro:
      'Optional — write a quick summary for this training (focus, goals, feedback for next session).',
    coachNotes: 'Coach notes',
    placeholder: 'e.g. Strong rail work today. Next time focus on backside top turns.',
    saveAndFinish: 'Save & finish session',
    finishWithoutNotes: 'Finish without notes',
  },
  leaveSessionConfirm: {
    eyebrow: 'Active session',
    title: 'Leave this session?',
    intro:
      'Are you sure you want to go back? This session will not be saved and all logged data will be lost.',
    leaveWithoutSaving: 'Leave without saving',
    stayInSession: 'Stay in session',
  },
  closeWaveConfirm: {
    eyebrow: 'Close wave',
    title: 'Close this wave?',
    intro: 'Do you want to close the current wave and return to athlete selection?',
    yes: 'Yes',
    no: 'No',
  },
  confirmDelete: {
    eyebrow: 'Delete',
    delete: 'Delete',
    cancel: 'Cancel',
  },
  installAppBanner: {
    ariaLabel: 'Install SurfStar',
    eyebrow: 'Add to home screen',
    title: 'Open SurfStar like an app',
    iosSteps: [
      'Tap Share in Safari (□ with arrow)',
      'Choose Add to Home Screen',
      'Tap Add — the SurfStar icon appears on your phone',
    ],
    androidPrompt:
      'Install SurfStar on your phone for one-tap access at the beach — no App Store needed.',
    androidManual:
      'In Chrome, open the menu (⋮) and tap Install app or Add to Home screen.',
    install: 'Install SurfStar',
    gotIt: 'Got it',
    notNow: 'Not now',
  },
  authShell: {
    taglineLead: 'Get ready to',
    taglineSlogan: 'Ride · Improve · Win',
  },
  termsAcceptance: {
    prefix: 'I agree to the',
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    suffix: '.',
  },
  manualBillingNotice: {
    ariaLabel: 'Manual billing instructions',
    title: 'Important — please read',
    leadWaiting:
      'Your coach account is created, but you cannot use SurfStar yet. Follow these steps:',
    leadSubmitted:
      'Your request was received. Your account will stay locked until an administrator completes the steps below.',
    steps: [
      'Wait for our team to review your request (usually within 2 business days).',
      'Check your inbox{{emailSuffix}} — we will send payment details by email (IBAN / bank transfer or MB Way).',
      'Pay your subscription using exactly the details in that email.',
      'Wait for the administrator to confirm your payment and activate your account. This is required — paying alone does not unlock access immediately.',
      'Return to this page (or sign in again). Access opens automatically once activation is complete.',
    ],
    footer:
      'Do not create a second account. If you have already paid, keep this page open or sign in later — activation can take up to one business day after payment is confirmed.',
  },
  sessionFeedback: {
    title: 'Quick check-in',
    lead: 'Rate each item from 0 to 5 — it takes less than a minute.',
    optionalSuffix: 'optional',
    notePlaceholder: 'Optional comment for your coach…',
    submit: 'Submit check-in',
    skip: 'Skip for now',
    submitFailed: 'Could not submit check-in. Please try again.',
    checkinSubmitted: 'Check-in submitted. Thank you!',
  },
  installInstructions: {
    alreadyInstalled: 'SurfStar is already installed on this device.',
  },
  deleteAccount: {
    title: 'Delete account',
    pendingMessage:
      'Your deletion request is pending review. Contact {{email}} if you submitted this by mistake.',
    signOut: 'Sign out',
    description:
      'Request permanent deletion of your SurfStar {{role}} account and personal data. This cannot be undone once processed.',
    cancelSubscriptionHint:
      'We recommend canceling your subscription first. You can still request deletion while subscribed — access ends when the account is deleted.',
    requestDeletion: 'Request account deletion',
    reasonOptional: 'Reason (optional)',
    reasonPlaceholder: 'Tell us why you are leaving (optional)',
    confirmHint:
      'By submitting, you confirm you want your account and personal data permanently deleted.',
    confirmDeletion: 'Confirm deletion request',
    submitting: 'Submitting…',
    cancel: 'Cancel',
    successMessage:
      'Deletion request submitted. We will process it within 30 days and email you at the address on your account.',
    roleCoach: 'coach',
    roleAthlete: 'athlete',
  },
} as const
