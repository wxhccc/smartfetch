import type { BoolRef, LockRefHandle, WpOptions } from '@wxhccc/es-util'

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK'

export type SerializableValue =
  | null
  | undefined
  | number
  | string
  | Date
  | SerializableValue[]
  | {
      [x: string]: SerializableValue
    }
export interface SerializableObject {
  [x: string]: SerializableValue
}

export type RequestData = SerializableObject | FormData

export type HeadersData = Record<string, string | number>

export type BodyResponseType = Exclude<keyof Body, 'body' | 'bodyUsed'>
/** 基础请求配置对象，AxiosRequestConfig的子集，未列出的属性独立fetch不支持或功能有差异 */
export interface RequestConfig {
  url?: string
  method?: string
  baseURL?: string
  headers?: HeadersData
  params?: any
  data?: any
  timeout?: number
  withCredentials?: boolean
  responseType?: BodyResponseType
}

export interface BaseConfig extends Omit<RequestConfig, 'headers'> {
  /** 全局附加headers数据，也可以用函数动态返回 */
  headers?: HeadersData | ((configKey: string) => HeadersData)
  /** 当前配置项自定义参数对象，优先级高于基础参数 */
  options?: BaseConfigOptions
}

export type MappedBaseConfigs<BC extends BaseConfig = BaseConfig> = Record<
  string,
  BC
>

export type BaseConfigWithKey<T = BaseConfig> = T & { key: string }

export type BaseConfigs<T = BaseConfig> = T | BaseConfigWithKey<T>[]

export type BaseData =
  | SerializableObject
  | ((configKey: string, type: 'params' | 'data') => SerializableObject)

export interface ErrorHandler<R = Response> {
  (message?: string, error?: Error, response?: R): void
}
export interface StatusErrorHandler<RC = RequestConfig> {
  (status: number, error?: Error, config?: RC): void | Promise<void>
}
export interface CodeErrorHandler {
  (responseJson: SerializableObject): void
}
export type ResponseCodeCheck = (responseJson: SerializableObject) => boolean
export interface BaseConfigOptions {
  /** 基础数据，会添加到所有请求的数据中，对于同时有params和data数据的请求，会同时添加到对应的数据中，如需分开控制，可用函数的第二个参数控制 */
  baseData?: BaseData
  /** 请求的response状态码判断函数，默认会使用fetch和axios的自带逻辑判断 */
  validateStatus?: (status: number) => boolean
  /** 业务code检查逻辑，可以使用字符串，为字符串时会判断返回数据中对应的属性是否是falsy，不是则表示有业务code错误，也可以用函数来自定义判定逻辑 */
  responseCodeCheck?: string | ResponseCodeCheck
  /** 业务code验证通过后，可以通过dataKey直接获取对应的数据 */
  dataKey?: string
  /** 状态码错误提示文案对象，key为状态码，value为对应提示，eg: { 500: '服务器维护中...' } */
  statusWarn?: { [key: number]: string }
  /** 状态码错误处理函数，可用于处理401等鉴权处理，如果函数返回的是Promise对象，对象resolve时会再次发送请求，reject时会进行后续处理。返回promise主要用于需要进行token刷新的场景 */
  statusHandler?: StatusErrorHandler
  /** 业务code错误处理函数，优先级低于statusHandler */
  codeErrorHandler?: CodeErrorHandler
  /** 全局错误处理函数，优先级最低 */
  errorHandler?: ErrorHandler
  // 过滤config.params(get 方式参数)中的空字段
  paramsFilterNullable?: boolean
  /** 是否将返回数据中data里的null转换为undefined */
  switchDataNull?: boolean
}
export interface SmartFetchRootOptions extends BaseConfigOptions {
  /** 基础配置项，可以是单个配置对象，也可以是配置对象数组 */
  baseConfigs?: BaseConfigs
}
export interface SmartInstanceContext {
  /** 基础参数对象 */
  options: SmartFetchRootOptions
  /** 配置项的map格式 */
  mappedBaseCfgs: MappedBaseConfigs
}

export type HangOnStatus = 'sucess' | 'fail' | 'waiting' | undefined

export interface HangOnState {
  status: HangOnStatus
  hangOnPromise?: Promise<'sucess' | 'fail'>
  hangOnBefore: () => Promise<'sucess' | 'fail'>
  switchStatus: (status?: HangOnStatus) => void
}
export interface FetchRequestContext {
  hangOnState: HangOnState
  /** 是否使用的window.fetch */
  useFetch: boolean
  /** 当前使用的请求配置项的key */
  useConfig: string
  /** 当前请求使用的基础配置 */
  config: BaseConfig
  /** 当前请求使用的配置参数，已合并后的配置 */
  options: BaseConfigOptions
  /** 请求返回的响应体，请求完成后会被设置 */
  __response?: Response
  /** fetch请求的配置对象 */
  __fetchConfig?: RequestInit
  mergeConfigData: <T = RequestConfig>(config: T, useConfig?: string) => T
}

export type FaileHandle = (e: Error) => unknown

export interface FetchOptions
  extends Pick<WpOptions<Record<string, any>>, 'lock' | 'syncRefHandle'>, Pick<BaseConfigOptions, 'paramsFilterNullable' | 'switchDataNull'> {
  /** 锁定变量，如果是函数则仅在请求开始和结束时调用，如果是[setter, getter]格式的数组，则会阻止锁定变量控制的请求未完成前重复触发 */
  /** 当前请求使用的配置项对应的key，默认default */
  useConfig?: string
  /** 当前请求是否为静默模式，即不使用默认配置提示错误，仍可自行处理错误 */
  silence?: boolean
  /** 当前请求是否需要检查业务code */
  needCodeCheck?: boolean
  /** 本次请求忽视状态检查的等待，主要用于在状态处理逻辑内发起请求 */
  ignoreStatusHandle?: boolean
}

export type FetchReturn<T, E extends Error = Error> = Promise<
  [null, T | undefined] | [E, undefined]
>

export interface FetchCore<
  DataType = any,
  RC = RequestConfig,
  E extends Error = Error
> {
  (
    context: FetchRequestContext,
    reqConfig: RC,
    options?: FetchOptions
  ): FetchReturn<SerializableObject | DataType | undefined, E>
}

export interface SFetch<RC = RequestConfig, E extends Error = Error> {
  <T = any>(config: RC, options?: FetchOptions): FetchReturn<T, E>
  <T = any, P extends Record<string, any> = RequestData>(
    url: string,
    data?: string | P,
    method?: Method,
    options?: FetchOptions
  ): FetchReturn<T, E>
}

export type SFetchWithOptions = <T = any>(
  configCreator: (...args: unknown[]) => RequestConfig
) => FetchReturn<T>
