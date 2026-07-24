import type { AuthPublicView, PublicView } from './types'

const PATHS: Record<PublicView, string> = {
  landing: '/',
  'coach-sign-in': '/login/coach',
  'coach-sign-up': '/signup/coach',
  'athlete-sign-in': '/login/athlete',
  'athlete-sign-up': '/signup/athlete',
  checkout: '/checkout',
}

export function pathForPublicView(view: PublicView): string {
  return PATHS[view]
}

export function publicViewFromPath(pathname: string): PublicView {
  if (pathname === '/login/coach' || pathname === '/login') return 'coach-sign-in'
  if (pathname === '/signup/coach') return 'coach-sign-up'
  if (pathname === '/login/athlete') return 'athlete-sign-in'
  if (pathname === '/signup/athlete') return 'athlete-sign-up'
  if (pathname === '/checkout') return 'checkout'
  if (pathname === '/forgot-password') return 'coach-sign-in'
  return 'landing'
}

export function isAuthPublicView(view: PublicView): view is AuthPublicView {
  return (
    view === 'coach-sign-in' ||
    view === 'coach-sign-up' ||
    view === 'athlete-sign-in' ||
    view === 'athlete-sign-up'
  )
}

export function isForgotPasswordPath(pathname: string): boolean {
  return pathname === '/forgot-password'
}

export function navigateToLandingPricing(replace = false) {
  if (replace) {
    window.history.replaceState({}, '', '/#packs')
  } else {
    window.history.pushState({}, '', '/#packs')
  }
}

export function scrollToPricingSection(behavior: ScrollBehavior = 'smooth') {
  document.getElementById('packs')?.scrollIntoView({ behavior, block: 'start' })
}

export function navigateToPublicView(view: PublicView, replace = false) {
  const path = pathForPublicView(view)
  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }
}

export function navigateToForgotPassword() {
  window.history.pushState({}, '', '/forgot-password')
}

export function navigateToCheckoutSuccess() {
  window.history.replaceState({}, '', '/checkout?success=1')
}

export function isCheckoutSuccess(): boolean {
  return new URLSearchParams(window.location.search).get('success') === '1'
}
