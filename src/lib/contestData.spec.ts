import { describe, expect, it } from 'vitest'
import {
  factsIndexToHistoryDays,
  factsToStandingRows,
  predictionToEntries,
  resolveContestStandingsRelativePath,
} from './contestData'
import type {
  ContestFactsFile,
  ContestFactsIndex,
  ContestParticipantsFile,
  ContestPredictionFile,
} from '@/types/league'

const participants: ContestParticipantsFile = {
  contestId: 'rpl-26-27',
  participants: [
    { id: 'zenit-st-petersburg', name: 'Zenit St Petersburg', aliases: ['Zenit'] },
    { id: 'krasnodar', name: 'Krasnodar' },
  ],
}

describe('contestData adapters', () => {
  it('maps prediction items to league entries by participant name', () => {
    const prediction: ContestPredictionFile = {
      kind: 'prediction',
      contestId: 'rpl-26-27',
      date: '2026-08-11',
      items: [
        { participantId: 'zenit-st-petersburg', probability: 39.8 },
        { participantId: 'unknown-team', probability: 1 },
      ],
    }

    expect(predictionToEntries(prediction, participants)).toEqual([
      {
        participantId: 'zenit-st-petersburg',
        team: 'Zenit St Petersburg',
        win_predict: 39.8,
      },
      {
        participantId: 'unknown-team',
        team: 'unknown-team',
        win_predict: 1,
      },
    ])
  })

  it('maps facts rows to standings with default empty group', () => {
    const facts: ContestFactsFile = {
      kind: 'standings',
      contestId: 'rpl-26-27',
      date: '2026-08-11',
      metric: 'points',
      rows: [
        {
          participantId: 'krasnodar',
          played: 3,
          wins: 3,
          draws: 0,
          losses: 0,
          points: 9,
          rank: 1,
        },
      ],
    }

    expect(factsToStandingRows(facts, participants)).toEqual([
      {
        participantId: 'krasnodar',
        team: 'Krasnodar',
        played: 3,
        wins: 3,
        draws: 0,
        losses: 0,
        points: 9,
        winPercent: undefined,
        playoffSeed: undefined,
        group: '',
        rank: 1,
        sourceRank: undefined,
      },
    ])
  })

  it('normalizes facts index to history days', () => {
    const index: ContestFactsIndex = {
      contestId: 'rpl-26-27',
      kind: 'facts',
      factKind: 'standings',
      grain: 'matchday',
      count: 2,
      first: '2026-08-09',
      last: '2026-08-11',
      days: ['2026-08-09', '2026-08-11'],
    }

    expect(factsIndexToHistoryDays(index)).toEqual({
      leagueId: 'rpl-26-27',
      count: 2,
      first: '2026-08-09',
      last: '2026-08-11',
      days: ['2026-08-09', '2026-08-11'],
    })
  })

  it('resolves matchday and day standings paths', () => {
    const matchday: ContestFactsIndex = {
      contestId: 'rpl-26-27',
      kind: 'facts',
      factKind: 'standings',
      grain: 'matchday',
      count: 1,
      first: '2026-08-11',
      last: '2026-08-11',
      days: ['2026-08-11'],
      tours: [
        {
          tour: 3,
          status: 'final',
          slices: ['2026-08-11'],
          latestDate: '2026-08-11',
          latestFile: 'standings/tour-03/latest.json',
        },
      ],
    }

    expect(resolveContestStandingsRelativePath(matchday, '2026-08-11')).toBe(
      'standings/tour-03/2026-08-11.json',
    )
    expect(
      resolveContestStandingsRelativePath(
        {
          contestId: 'mlb',
          kind: 'facts',
          factKind: 'standings',
          count: 1,
          first: '2026-03-25',
          last: '2026-03-25',
          days: ['2026-03-25'],
        },
        '2026-03-25',
      ),
    ).toBe('standings/2026-03-25.json')
  })
})
