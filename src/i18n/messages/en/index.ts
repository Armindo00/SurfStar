import type { MessageCatalog } from '../../types'
import { admin } from './admin'
import { analytics } from './analytics'
import { athlete } from './athlete'
import { auth } from './auth'
import { billing } from './billing'
import { coach } from './coach'
import { common, comboLevels, language, levels, maneuvers, roles, trainingModes } from './core'
import { components } from './components'
import { errors } from './errors'
import { help } from './help'
import { landing } from './landing'
import { legal } from './legal'
import { nav } from './nav'
import { plans } from './plans'
import { session } from './session'
import { ui } from './ui'

/** Backward-compatible flat namespaces used by existing t() calls. */
const subscription = plans.subscription
const athletePortal = {
  languageTitle: athlete.languageTitle,
  signOut: athlete.signOut,
}

export const en: MessageCatalog = {
  locale: 'en',
  common,
  roles,
  language,
  trainingModes,
  maneuvers,
  comboLevels,
  levels,
  subscription,
  athletePortal,
  landing,
  nav,
  auth,
  coach,
  athlete,
  session,
  plans,
  billing,
  components,
  analytics,
  legal,
  help,
  admin,
  ui,
  errors,
}

export {
  admin,
  analytics,
  athlete,
  auth,
  billing,
  coach,
  common,
  comboLevels,
  components,
  errors,
  help,
  landing,
  legal,
  levels,
  maneuvers,
  nav,
  plans,
  roles,
  session,
  trainingModes,
  ui,
}
