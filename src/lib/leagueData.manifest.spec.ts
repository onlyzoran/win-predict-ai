import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  }
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  }
}

describe('fetchLeaguesManifest', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_LEAGUES_URL', 'http://example.test/api/leagues.json')
    vi.stubEnv('VITE_DATA_BASE_URL', 'https://onlyzoran.github.io/win-predict-ai-data/data')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('falls back to GitHub Pages manifest when the primary leagues URL fails', async () => {
    const manifest = [{ id: 'epl', title: 'EPL' }]
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
      const url = String(input)
      if (url.includes('/api/leagues.json')) {
        return errorResponse(404)
      }
      if (url.endsWith('/data/leagues.json')) {
        return jsonResponse(manifest)
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { fetchLeaguesManifest } = await import('./leagueData')
    await expect(fetchLeaguesManifest()).resolves.toEqual(manifest)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
