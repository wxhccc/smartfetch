import {
  BaseConfigs,
  Method,
  RequestConfig,
  RequestData,
  SmartInstanceContext
} from './types'
import { appendDataToForm, buildUrl, objType, resolveFunctional } from './utils'

const urlMethod: Method[] = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH'
]

/** 数据的编码方式，拼接在地址上时仅支持urlencode，通过body发送时各方式均支持 */
export type EnctypeType = 'json' | 'urlencode' | 'text' | 'none'

const enctypeType: Partial<Record<EnctypeType, string>> = {
  json: 'application/json',
  urlencode: 'application/x-www-form-urlencoded',
  text: 'text/plain'
}
export interface RequestExtraArgs<C extends string = string> {
  /** 使用那个key对应的基础配置 */
  useConfig?: C
  /** 数据的编码方式 */
  enctype?: EnctypeType
}

export default function <T = BaseConfigs, CK extends string = string>(
  context: SmartInstanceContext<T>
) {
  /** 合并配置中的公共数据 */
  const mergeConfigData = <T extends RequestConfig = RequestConfig>(
    config: T,
    useConfig = 'default' as CK
  ) => {
    const { options, mappedBaseCfgs } = context
    const { baseData, headers: baseHeaders } = {
      ...options,
      ...mappedBaseCfgs[useConfig]
    }
    const { options: _opts, ...cfgConfig } = mappedBaseCfgs[useConfig] || {}
    const { headers, ...rest } = config
    const newConfig = { ...cfgConfig, ...rest } as T

    if (headers || baseHeaders) {
      const bHeaders = resolveFunctional(baseHeaders, useConfig)
      newConfig.headers = { ...bHeaders, ...headers }
    }
    if (baseData) {
      const { params, data } = config
      const bParams = resolveFunctional(baseData, useConfig, 'params')
      const bData = resolveFunctional(baseData, useConfig, 'data')
      if (bParams) {
        newConfig.params = { ...bParams, ...params }
      }
      if (bData && objType(data) === 'Object') {
        if (data instanceof FormData) {
          appendDataToForm(newConfig.data, bData)
        } else {
          newConfig.data = { ...bData, ...data }
        }
      }
    }

    return newConfig
  }
  /** get request config data */
  const createRequestConfig = <
    T extends RequestConfig = RequestConfig,
    P extends Record<string, any> = RequestData
  >(
    url: string,
    data?: string | P,
    method: Method = 'GET',
    extra?: RequestExtraArgs<CK>
  ) => {
    const { useFetch } = context
    const { enctype } = {
      useConfig: 'default',
      enctype: 'json',
      ...extra
    } as Required<RequestExtraArgs>

    method = urlMethod.includes(method) ? method : 'GET'
    const isNoBody = ['GET', 'HEAD'].includes(method)

    const result = {
      url,
      method: (useFetch ? method : method.toLowerCase()) as Method,
      ...(isNoBody ? { params: data } : { data })
    } as T
    if (enctype !== 'none')
      result.headers = {
        'Content-Type': (enctypeType[enctype]
          ? enctypeType[enctype]
          : enctypeType['json']) as string
      }
    if (useFetch && enctype !== 'json') {
      result.responseType = 'blob'
    }
    return result
  }

  /** get request url link */
  const returnRequestLink = <P extends Record<string, any> = RequestData>(
    url: string,
    params: P | undefined,
    useConfig = 'default' as CK
  ) => {
    const { baseURL = '', params: handleData } = mergeConfigData<RequestConfig>(
      { params },
      useConfig
    )
    const paramsUrl = buildUrl(url, handleData)
    if (url.startsWith('http')) {
      return paramsUrl
    }
    return baseURL + paramsUrl
  }

  return { mergeConfigData, createRequestConfig, returnRequestLink }
}
