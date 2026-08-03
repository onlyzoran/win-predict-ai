import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatPercent, formatSeason, getDaysSince, getDaysUntil, getTournamentProgress } from './utils'

describe('getTournamentProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 when start or end date is missing', () => {
    expect(getTournamentProgress('', '2026-06-01')).toBe(0)
    expect(getTournamentProgress('2026-01-01', '')).toBe(0)
  })

  it('returns 0 before the tournament starts', () => {
    vi.setSystemTime(new Date('2025-12-31T12:00:00Z'))
    expect(getTournamentProgress('2026-01-01', '2026-12-31')).toBe(0)
  })

  it('returns 100 after the tournament ends', () => {
    vi.setSystemTime(new Date('2027-01-01T12:00:00Z'))
    expect(getTournamentProgress('2026-01-01', '2026-12-31')).toBe(100)
  })

  it('returns mid-progress between start and end', () => {
    vi.setSystemTime(new Date('2026-07-02T00:00:00Z'))
    expect(getTournamentProgress('2026-01-01', '2026-12-31')).toBeCloseTo(50, 0)
  })

  it('prefers endDateTo when provided', () => {
    vi.setSystemTime(new Date('2026-07-02T00:00:00Z'))
    expect(getTournamentProgress('2026-01-01', '2026-06-01', '2026-12-31')).toBeCloseTo(50, 0)
  })
})

describe('getDaysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when the date is missing or invalid', () => {
    expect(getDaysUntil('')).toBeNull()
    expect(getDaysUntil('not-a-date')).toBeNull()
  })

  it('returns the number of days until the target date', () => {
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'))
    expect(getDaysUntil('2026-08-21')).toBe(20)
  })

  it('returns 0 on the target date', () => {
    vi.setSystemTime(new Date('2026-08-21T12:00:00Z'))
    expect(getDaysUntil('2026-08-21')).toBe(0)
  })

  it('returns 0 after the target date', () => {
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'))
    expect(getDaysUntil('2026-08-21')).toBe(0)
  })
})

describe('getDaysSince', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when the date is missing or invalid', () => {
    expect(getDaysSince('')).toBeNull()
    expect(getDaysSince('not-a-date')).toBeNull()
  })

  it('returns 0 before and on the target date', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00Z'))
    expect(getDaysSince('2026-08-21')).toBe(0)

    vi.setSystemTime(new Date('2026-08-21T12:00:00Z'))
    expect(getDaysSince('2026-08-21')).toBe(0)
  })

  it('returns the number of days since the target date', () => {
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'))
    expect(getDaysSince('2026-08-21')).toBe(20)
  })
})

describe('formatPercent', () => {
  it('formats zero and negative values as 0%', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(-5)).toBe('0%')
  })

  it('formats values below 1 as <1%', () => {
    expect(formatPercent(0.4)).toBe('<1%')
    expect(formatPercent(0.9)).toBe('<1%')
  })

  it('rounds values of 1 and above', () => {
    expect(formatPercent(1)).toBe('1%')
    expect(formatPercent(12.4)).toBe('12%')
    expect(formatPercent(12.6)).toBe('13%')
    expect(formatPercent(100)).toBe('100%')
  })
})

describe('formatDate', () => {
  it('returns an empty string for missing dates', () => {
    expect(formatDate('', 'en')).toBe('')
  })

  it('formats a date for the given locale', () => {
    expect(formatDate('2026-03-15', 'en')).toMatch(/Mar/)
    expect(formatDate('2026-03-15', 'en')).toMatch(/15/)
    expect(formatDate('2026-03-15', 'en')).toMatch(/2026/)
  })
})

describe('formatSeason', () => {
  it('returns an empty string when dates are missing', () => {
    expect(formatSeason('', '2027-05-30')).toBe('')
    expect(formatSeason('2026-09-15', '')).toBe('')
  })

  it('formats a cross-year season', () => {
    expect(formatSeason('2026-09-15', '2027-05-30')).toBe('2026/2027')
  })

  it('formats a same-year season as a single year', () => {
    expect(formatSeason('2027-04-08', '2027-04-11')).toBe('2027')
  })

  it('formats short years when requested', () => {
    expect(formatSeason('2026-09-15', '2027-05-30', { short: true })).toBe('26/27')
    expect(formatSeason('2027-04-08', '2027-04-11', { short: true })).toBe('27')
  })
})
