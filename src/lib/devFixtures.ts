export function useDevFixtures(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_DEV_FIXTURES === 'true'
}
