import { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'

export type SerializableObject = {
  [x: string]: SerializableObject | number | string | [] | Date
}

export type RequestData = SerializableObject | FormData

export interface BaseConfig extends AxiosRequestConfig {
  key?: string
  headers?: RequestInit['headers'] | (() => RequestInit['headers'])
}

export type WinFetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>
export type FetchCore = AxiosInstance | WinFetch

export type RequestConfig = Omit<AxiosRequestConfig, 'headers'> &
  Omit<RequestInit, 'method'>

export type BaseConfigWithKey = BaseConfig & { key: string }

export type BaseConfigs = BaseConfig | BaseConfigWithKey[]
export type MappedBaseConfigs = Record<string, BaseConfig>

export type BaseData = Record<string, any> | (() => Record<string, any>)

export type FetchResponse = Response | AxiosResponse

export interface ErrorHandler {
  (message?: string, error?: Error, response?: FetchResponse): void
}

export interface StatusErrorHandler {
  (status: number, error?: Error, config?: RequestConfig): void | Promise<void>
}

export interface CodeErrorHandler {
  (responseJson: SerializableObject): void
}

export interface SmartFetchOptions {
  /** 基础配置项，可以是单个配置对象，也可以是配置对象数组 */
  baseConfigs?: BaseConfigs
  /** 基础数据，会添加到所有请求的数据中，对于同时有params和data数据的请求，会同时添加到对应的数据中 */
  baseData?: SerializableObject | ((coreKey: string) => SerializableObject)
  /** 请求的response状态码判断函数，默认会使用fetch和axios的自带逻辑判断 */
  validateStatus?: (status: number) => boolean
  /** 业务code检查逻辑，可以使用字符串，为字符串时会判断返回数据中对应的属性是否是falsy，不是则表示有业务code错误，也可以用函数来自定义判定逻辑 */
  responseCodeCheck?: string | ((responseJson: SerializableObject) => boolean)
  /** 是否强制使用axios作为请求发送核心，默认自动选择 */
  forceAxios?: boolean
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

export interface SmartInstanceContext {
  useFetch: boolean
  options: SmartFetchOptions
  baseCfgs: MappedBaseConfigs
}

export type FaileHandle = (e: Error) => unknown

export type LockSetter = (bool: boolean) => void

export type LockSwitch = LockSetter | [LockSetter, () => boolean]

export interface FetchOptions
  extends Pick<SmartFetchOptions, 'paramsFilterNullable' | 'switchDataNull'> {
  /** 锁定变量，如果是函数则仅在请求开始和结束时调用，如果是[setter, getter]格式的数组，则会阻止锁定变量控制的请求未完成前重复触发 */
  lock?: LockSwitch
  /** 当前请求使用的配置项对应的key，默认default */
  useCore?: string
  /** 当前请求是否为静默模式，即不提示错误 */
  silence?: boolean
  /** 当前请求是否需要检查业务code */
  needCodeCheck?: boolean
  /** 请求失败的自定义处理逻辑 */
  failHandler?: FaileHandle
}

export type FetchReturn<T> = Promise<[null, T] | [Error, undefined]>

export interface SFetch {
  <T = any>(config: RequestConfig, options?: FetchOptions): FetchReturn<T>
  <T, P extends Record<string, any> = RequestData>(
    url: string,
    data?: P,
    method?: Method,
    options?: FetchOptions
  ): FetchReturn<T>
}
