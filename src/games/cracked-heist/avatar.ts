import type { Avatar } from './types'

export const COLOR_PALETTE = [
  '#4ade80', '#22c55e', '#16a34a', '#15803d',
  '#a3e635', '#84cc16', '#65a30d', '#4d7c0f',
  '#34d399', '#10b981', '#059669', '#047857',
  '#5eead4', '#2dd4bf', '#14b8a6', '#0f766e',
  '#22d3ee', '#06b6d4', '#0891b2', '#0e7490',
  '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
  '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
  '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9',
  '#c084fc', '#a855f7', '#9333ea', '#7e22ce',
  '#e879f9', '#d946ef', '#c026d3', '#a21caf',
  '#f472b6', '#ec4899', '#db2777', '#be185d',
  '#fb7185', '#f43f5e', '#e11d48', '#be123c',
  '#fbbf24', '#f59e0b', '#d97706', '#b45309',
  '#fde047', '#facc15', '#eab308', '#ca8a04',
  '#fb923c', '#f97316', '#ea580c', '#c2410c',
  '#f0fdf4', '#d1fae5', '#9ca3af', '#4b5563',
]

export function randomAvatar(): Avatar {
  return {
    color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
  }
}

export function defaultAvatar(): Avatar {
  return { color: '#4ade80' }
}
