import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTournamentProgress(startDate: string, endDate: string, endDateTo?: string) {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(startDate).getTime()
  const end = new Date(endDateTo || endDate).getTime()
  const now = Date.now()

  if (now <= start) {
    return 0
  }

  if (now >= end) {
    return 100
  }

  return ((now - start) / (end - start)) * 100
}

export function formatDate(date: string, locale: string) {
  if (!date) {
    return ''
  }

  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatSeason(
  startDate: string,
  endDate: string,
  options?: { short?: boolean },
) {
  if (!startDate || !endDate) {
    return ''
  }

  const startYear = new Date(startDate).getFullYear()
  const endYear = new Date(endDate).getFullYear()

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return ''
  }

  const formatYear = (year: number) =>
    options?.short ? String(year).slice(-2) : String(year)

  if (startYear === endYear) {
    return formatYear(startYear)
  }

  return `${formatYear(startYear)}/${formatYear(endYear)}`
}

export function formatPercent(value: number) {
  if (value <= 0) {
    return '0%'
  }

  if (value < 1) {
    return '<1%'
  }

  return `${Math.round(value)}%`
}
