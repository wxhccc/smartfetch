import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  RequestConfig,
  BaseConfig,
  BaseConfigOptions,
  ErrorHandler,
  StatusErrorHandler,
  BaseConfigs
} from './types'

export type { AxiosRequestConfig }

export type FullRequestConfig = RequestConfig | AxiosRequestConfig

export type AxiosBaseConfig = Pick<BaseConfig, 'headers' | 'options'> &
  AxiosRequestConfig

export interface MixedBaseConfigOptions
  extends Omit<BaseConfigOptions, 'statusHandler' | 'errorHandler'> {
  /** 状态码错误处理函数，可用于处理401等鉴权处理，如果函数返回的是Promise对象，对象resolve时会再次发送请求，reject时会进行后续处理。返回promise主要用于需要进行token刷新的场景 */
  statusHandler?: StatusErrorHandler | StatusErrorHandler<AxiosRequestConfig>
  /** 全局错误处理函数，优先级最低 */
  errorHandler?: ErrorHandler | ErrorHandler<AxiosResponse>
}

export interface SmartFetchMixedRootOptions extends MixedBaseConfigOptions {
  /** 基础配置项，可以是单个配置对象，也可以是配置对象数组 */
  baseConfigs?: BaseConfigs | BaseConfigs<AxiosBaseConfig>
}
