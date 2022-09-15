import type { AxiosRequestConfig } from 'axios'
import { BaseConfig } from './types'

export type { AxiosRequestConfig }

export type AxiosBaseConfig = BaseConfig<AxiosRequestConfig>

export type FullBaseConfig = BaseConfig | AxiosBaseConfig
