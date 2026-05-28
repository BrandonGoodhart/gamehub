import type { Avatar, FaceExpression, HairStyle, HatKind } from './types'

export const HAIR_STYLES: HairStyle[] = ['short', 'long', 'mohawk', 'curly', 'bald', 'bun', 'spiky']
export const EXPRESSIONS: FaceExpression[] = ['happy', 'cool', 'wink', 'angry', 'goofy', 'serious']
export const HATS: HatKind[] = ['none', 'cap', 'hoodie', 'crown', 'beanie', 'helmet', 'witch']

export const SKIN_COLORS = ['#fde0c5', '#f5c890', '#e0a571', '#b4774a', '#7a4a2e', '#3d2316', '#a3e635']
export const HAIR_COLORS = ['#1a1a1a', '#5a3a2a', '#c4884a', '#e8c252', '#d44a2e', '#7a3a8a', '#34d399', '#60a5fa', '#f472b6', '#f9fafb']
export const HAT_COLORS = ['#22c55e', '#16a34a', '#eab308', '#dc2626', '#3b82f6', '#a855f7', '#f97316', '#1f2937']

export function randomAvatar(): Avatar {
  return {
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
    expression: EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)],
    hat: HATS[Math.floor(Math.random() * HATS.length)],
    hatColor: HAT_COLORS[Math.floor(Math.random() * HAT_COLORS.length)],
  }
}

export function defaultAvatar(): Avatar {
  return {
    hairStyle: 'short',
    hairColor: '#1a1a1a',
    skinColor: '#f5c890',
    expression: 'happy',
    hat: 'none',
    hatColor: '#22c55e',
  }
}
