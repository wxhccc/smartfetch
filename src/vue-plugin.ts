import { ComponentCustomProperties } from 'vue'
import { SFetch } from './types'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $fetch: SFetch
  }
}
