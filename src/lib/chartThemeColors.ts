export const TOP_CHART_COLOR_TOKENS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const

export const OTHERS_CHART_COLOR_TOKEN_LIGHT = '--muted-foreground'
export const OTHERS_CHART_COLOR_TOKEN_DARK = '--muted'

export const CHART_COLORS: readonly [string, string, string, string, string] = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function getOthersChartColorToken(isDark: boolean): string {
  return isDark ? OTHERS_CHART_COLOR_TOKEN_DARK : OTHERS_CHART_COLOR_TOKEN_LIGHT
}

export function getOthersChartColor(isDark: boolean): string {
  return cssVar(getOthersChartColorToken(isDark))
}

export function cssVar(token: string): string {
  return `var(${token})`
}

export function readCssVariable(
  token: string,
  element: Element = document.documentElement,
): string {
  const name = token.startsWith('--') ? token : `--${token}`
  return getComputedStyle(element).getPropertyValue(name).trim()
}

export function readTopChartColors(element?: Element): string[] {
  return TOP_CHART_COLOR_TOKENS.map((token) => readCssVariable(token, element))
}

export function readOthersChartColor(element: Element = document.documentElement): string {
  const isDark = element.classList.contains('dark')
  return readCssVariable(getOthersChartColorToken(isDark), element)
}

export function getTeamChartColor(
  index: number,
  topN = TOP_CHART_COLOR_TOKENS.length,
): string | undefined {
  if (index < 0 || index >= topN) {
    return undefined
  }

  const token = TOP_CHART_COLOR_TOKENS[index % TOP_CHART_COLOR_TOKENS.length]
  return token ? cssVar(token) : cssVar(TOP_CHART_COLOR_TOKENS[0])
}
