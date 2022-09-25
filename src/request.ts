import { CT_JSON, CT_URLENCODE } from './const'
import {
  BaseConfig,
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

const enctypeType: Record<EnctypeType, string> = {
  json: CT_JSON,
  urlencode: CT_URLENCODE,
  text: 'text/plain',
  none: ''
}
export interface RequestExtraArgs<C extends string = string> {
  /** 使用那个key对应的基础配置 */
  useConfig?: C
  /** 数据的编码方式 */
  enctype?: EnctypeType
  /** 是否为window.fetch生成配置，默认会自动判断后传入 */
  useFetch?: boolean
}

export default function <CK extends string = string>(
  context: SmartInstanceContext
) {
  /** 合并配置中的公共数据 */
  const mergeConfigData = <T = RequestConfig>(
    config: T,
    useConfig = 'default'
  ) => {
    const { options, mappedBaseCfgs } = context
    const curCfg = (mappedBaseCfgs[useConfig] || {}) as BaseConfig
    const { options: cfgOptions, headers: baseHeaders, ...cfgConfig } = curCfg
    const { baseData } = { ...options, ...cfgOptions }

    const { headers, ...rest } = config as RequestConfig
    const newConfig = { ...cfgConfig, ...rest } as RequestConfig

    if (headers && (headers['content-type'] || headers['Content-Type'])) {
      headers['content-type'] = headers['Content-Type'] || headers['content-type']
    }

    if (headers || baseHeaders) {
      const bHeaders = resolveFunctional(baseHeaders, useConfig)
      newConfig.headers = { ...bHeaders, ...headers }
    }
    if (baseData) {
      const { params, data } = config as RequestConfig
      const bParams = resolveFunctional(baseData, useConfig, 'params')
      const bData = resolveFunctional(baseData, useConfig, 'data')
      if (bParams) {
        newConfig.params = { ...bParams, ...params }
      }
      if (bData) {
        if (FormData && data instanceof FormData) {
          appendDataToForm(newConfig.data, bData)
        } else {
          newConfig.data = { ...bData, ...(objType(data) === 'Object' ? data : {}) }
        }
      }
    }

    return newConfig as T
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
    const { enctype, useFetch } = {
      useConfig: 'default',
      enctype: 'json',
      ...extra
    } as Required<RequestExtraArgs>
    const upMethod = method.toUpperCase() as Method
    method = urlMethod.includes(upMethod) ? method : 'GET'
    const isNoBody = ['GET', 'HEAD'].includes(upMethod)

    const result = {
      url,
      method,
      ...(data ? isNoBody ? { params: data } : { data } : {})
    } as T
    if (enctype !== 'none'){
      const contentType = enctypeType[enctype] || enctypeType['json']
      result.headers = { 'content-type': contentType }
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
