import { BagColor } from '@/types/database'

interface ColorTheme {
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  textColor: string
}

const COLOR_THEMES: Record<BagColor, ColorTheme> = {
  red: {
    primary: 'rgb(239 68 68)', // red-500
    primaryLight: 'rgb(254 202 202)', // red-200
    primaryDark: 'rgb(185 28 28)', // red-700
    accent: 'rgb(252 165 165)', // red-300
    textColor: 'rgb(127 29 29)', // red-900
  },
  blue: {
    primary: 'rgb(59 130 246)', // blue-500
    primaryLight: 'rgb(191 219 254)', // blue-200
    primaryDark: 'rgb(29 78 216)', // blue-700
    accent: 'rgb(147 197 253)', // blue-300
    textColor: 'rgb(30 58 138)', // blue-900
  },
  green: {
    primary: 'rgb(34 197 94)', // green-500
    primaryLight: 'rgb(187 247 208)', // green-200
    primaryDark: 'rgb(21 128 61)', // green-700
    accent: 'rgb(134 239 172)', // green-300
    textColor: 'rgb(20 83 45)', // green-900
  },
  yellow: {
    primary: 'rgb(234 179 8)', // yellow-500
    primaryLight: 'rgb(254 240 138)', // yellow-200
    primaryDark: 'rgb(161 98 7)', // yellow-700
    accent: 'rgb(253 224 71)', // yellow-300
    textColor: 'rgb(113 63 18)', // yellow-900
  },
  pink: {
    primary: 'rgb(236 72 153)', // pink-500
    primaryLight: 'rgb(251 207 232)', // pink-200
    primaryDark: 'rgb(190 24 93)', // pink-700
    accent: 'rgb(249 168 212)', // pink-300
    textColor: 'rgb(131 24 67)', // pink-900
  },
  purple: {
    primary: 'rgb(168 85 247)', // purple-500
    primaryLight: 'rgb(233 213 255)', // purple-200
    primaryDark: 'rgb(126 34 206)', // purple-700
    accent: 'rgb(216 180 254)', // purple-300
    textColor: 'rgb(88 28 135)', // purple-900
  },
  orange: {
    primary: 'rgb(249 115 22)', // orange-500
    primaryLight: 'rgb(254 215 170)', // orange-200
    primaryDark: 'rgb(194 65 12)', // orange-700
    accent: 'rgb(253 186 116)', // orange-300
    textColor: 'rgb(124 45 18)', // orange-900
  },
  black: {
    primary: 'rgb(31 41 55)', // gray-800
    primaryLight: 'rgb(209 213 219)', // gray-300
    primaryDark: 'rgb(17 24 39)', // gray-900
    accent: 'rgb(156 163 175)', // gray-400
    textColor: 'rgb(0 0 0)', // black
  },
  white: {
    primary: 'rgb(107 114 128)', // gray-500
    primaryLight: 'rgb(243 244 246)', // gray-100
    primaryDark: 'rgb(55 65 81)', // gray-700
    accent: 'rgb(229 231 235)', // gray-200
    textColor: 'rgb(31 41 55)', // gray-800
  },
  multicolor: {
    primary: 'linear-gradient(to right, rgb(239 68 68), rgb(234 179 8), rgb(34 197 94), rgb(59 130 246), rgb(168 85 247))',
    primaryLight: 'rgb(243 244 246)', // gray-100
    primaryDark: 'rgb(107 114 128)', // gray-500
    accent: 'rgb(229 231 235)', // gray-200
    textColor: 'rgb(31 41 55)', // gray-800
  },
}

export function getColorTheme(color?: BagColor | string | null): ColorTheme {
  if (!color || !(color in COLOR_THEMES)) {
    return COLOR_THEMES.blue // default theme
  }
  return COLOR_THEMES[color as BagColor]
}

export function getColorValue(color?: BagColor | string | null): string {
  const theme = getColorTheme(color)
  return theme.primary
}
