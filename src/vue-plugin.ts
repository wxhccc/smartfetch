import type { ComponentCustomProperties } from 'vue'
import type { SFetch } from './types'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $fetch: SFetch
  }
}
