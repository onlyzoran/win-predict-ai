import { VueQueryPlugin, type QueryClient } from '@tanstack/vue-query'
import { createQueryClient } from '@/lib/queryClient'

export function createTestQueryClient() {
  const client = createQueryClient()
  client.setDefaultOptions({
    queries: {
      retry: false,
    },
  })
  return client
}

export function installQueryPlugin(queryClient: QueryClient) {
  return [VueQueryPlugin, { queryClient }] as const
}
