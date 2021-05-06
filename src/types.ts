import { PromiseWithLock } from '@wxhccc/es-util'
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'

export type SerializableObject = {
  [x: string]: SerializableObject | number | string | [] | Date
}

export type RequestData = SerializableObject | FormData

export interface BaseConfig extends AxiosRequestConfig {
  key?: string
}

export type WinFetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>
export type FetchCore = AxiosInstance | WinFetch

export interface RequestConfig<UseCore = 'default'>
  extends Omit<AxiosRequestConfig, 'headers'>,
    Omit<RequestInit, 'method'> {
  useCore?: UseCore
}

export type BaseConfigWithKey = BaseConfig & { key: string }

export type BaseConfigs = BaseConfig | BaseConfigWithKey[]
export type MappedBaseConfigs = Record<string, BaseConfig>

export type BaseData = Record<string, any> | (() => Record<string, any>)

export type FetchResponse = Response | AxiosResponse

interface ErrorHandler {
  (message?: string, error?: Error, response?: FetchResponse): void
}

interface CodeErrorHandler {
  (responseJson: SerializableObject): void
}

export interface SmartFetchOptions {
  baseConfigs?: BaseConfigs
  baseData?: SerializableObject | ((coreKey: string) => SerializableObject)
  errorHandler?: ErrorHandler
  statusWarn?: { [key: number]: string }
  validateStatus?: (status: number) => boolean
  responseCheck?: string | ((responseJson: SerializableObject) => boolean)
  forceAxios?: boolean
  dataKey?: string
  codeErrorHandler?: CodeErrorHandler
}

export interface SfRequestConfig {
  useFetch: boolean
  options: SmartFetchOptions
  baseConfigs: MappedBaseConfigs
}

export type FaileHandle = (e: Error) => unknown
export type SyncRefHandle = [Record<string, boolean>, string]
export type LockSwitchHook = (val: boolean) => unknown

export interface LockMethod<T> {
  (key: string): PromiseWithMethods<T>
  (syncRefHandle: SyncRefHandle): PromiseWithMethods<T>
  (
    switchHook: LockSwitchHook,
    syncRefHandle?: [Record<string, boolean>, string]
  ): PromiseWithMethods<T>
}

export interface PromiseWithMethods<T> extends PromiseWithLock<T> {
  done: <T>(
    onfulfilled?: ((value: any) => T | PromiseLike<T>) | null | undefined
  ) => PromiseWithMethods<T>
  faile: (handler: FaileHandle) => Promise<T>
  useCore: (corekey: string) => PromiseWithMethods<T>
  silence: () => PromiseWithMethods<T>
  notCheckCode: () => PromiseWithMethods<T>
}

export type ContextType = 'unknown' | 'vue' | 'react'

export interface FetchOptions {
  silence?: boolean
  needCodeCheck?: boolean
  failHandler?: FaileHandle
}

export interface SFetch {
  <T>(config: RequestConfig, options?: FetchOptions): PromiseWithMethods<T>
  <T>(
    url: string,
    data?: RequestData,
    method?: Method,
    options?: FetchOptions
  ): PromiseWithMethods<T>
}
