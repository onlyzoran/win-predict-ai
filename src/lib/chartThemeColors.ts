export const TOP_CHART_COLOR_TOKENS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const

export const OTHERS_CHART_COLOR_TOKEN = '--muted-foreground'

export const CHART_COLORS: readonly [string, string, string, string, string] = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export const OTHERS_CHART_COLOR = `var(${OTHERS_CHART_COLOR_TOKEN})`

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

export function readOthersChartColor(element?: Element): string {
  return readCssVariable(OTHERS_CHART_COLOR_TOKEN, element)
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
