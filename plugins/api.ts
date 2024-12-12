import { Plugin } from '@nuxt/types'
import { mockApi } from '~/services/mock-api'

declare module 'vue/types/vue' {
  interface Vue {
    $api: typeof mockApi
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $api: typeof mockApi
  }
  interface Context {
    $api: typeof mockApi
  }
}

const apiPlugin: Plugin = (_context, inject) => {
  // In development, use mock API
  if (process.env.NODE_ENV === 'development') {
    inject('api', mockApi)
  } else {
    // TODO: In production, use real API client
    inject('api', mockApi) // Temporarily use mock API in production too
  }
}

export default apiPlugin 