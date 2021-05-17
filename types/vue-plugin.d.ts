import type { SFetch } from './types';
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $fetch: SFetch;
    }
}
