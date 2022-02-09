import { isRef, App, Ref } from 'vue'
import { FetchOptions, RequestConfig, LockSwitch, LockSetter } from './types'
import smartfetch from './index'

/**
 * 组件内状态控制变量，字符串类型只在有上下文实例的环境内有用
 */
export type VueLockSwitch = LockSwitch | Ref<boolean> | string

/** 通用接口处理逻辑，包含了一些常用的数据处理过程 **/
export default function vueFetch<T = any>(
  this: any,
  config: RequestConfig,
  lockSetter?: VueLockSwitch,
  options?: Partial<FetchOptions>
) {
  const lock = isRef(lockSetter)
    ? ([
        (bool: boolean) => (lockSetter.value = bool),
        () => lockSetter.value
      ] as [LockSetter, () => boolean])
    : lockSetter

  const lockSwitch =
    lock instanceof Function || Array.isArray(lock)
      ? lock
      : this &&
        typeof lockSetter === 'string' &&
        typeof this[lockSetter] === 'boolean'
      ? ([
          (bool: boolean) => (this[lockSetter] = bool),
          () => this[lockSetter]
        ] as [LockSetter, () => boolean])
      : undefined
  return smartfetch.fetch<T>(config, { ...options, lock: lockSwitch })
}

export type VueFetch = typeof vueFetch

export function addSmartFetchPlugin(app: App) {
  app.config.globalProperties.$fetch = vueFetch
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $fetch: VueFetch
  }
}
