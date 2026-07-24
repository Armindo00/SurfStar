import type { PublicView } from './types'

const PATHS: Record<PublicView, string> = {
  landing: '/',
  login: '/login',
  checkout: '/checkout',
}

export function pathForPublicView(view: PublicView): string {
  return PATHS[view]
}

export function publicViewFromPath(pathname: string): PublicView {
  if (pathname === '/login') return 'login'
  if (pathname === '/checkout') return 'checkout'
  if (pathname === '/forgot-password') return 'login'
  return 'landing'
}

export function isForgotPasswordPath(pathname: string): boolean {
  return pathname === '/forgot-password'
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
