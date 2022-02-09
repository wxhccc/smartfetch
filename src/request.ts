import { Method } from 'axios'
import {
  BaseConfig,
  RequestConfig,
  RequestData,
  SerializableObject,
  SmartFetchOptions
} from './types'
import { buildUrl } from './utils'

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
type EnctypeType = 'json' | 'urlencode' | 'text' | 'none'

const enctypeType: Partial<Record<EnctypeType, string>> = {
  json: 'application/json',
  urlencode: 'application/x-www-form-urlencoded',
  text: 'text/plain'
}

function returnRequestLink(
  url: string,
  data: Record<string, any>,
  baseCfg?: BaseConfig
) {
  const paramsUrl = buildUrl(url, data)
  if (url.indexOf('http') >= 0) {
    return paramsUrl
  }
  const baseURL = baseCfg && baseCfg.baseURL ? baseCfg.baseURL : ''
  return baseURL + paramsUrl
}

interface RequestContext {
  /** 是否使用global.fetch发送请求 */
  useFetch: boolean
  /** 所有基础配置的key-value对象 */
  baseCfgs: Record<string, BaseConfig>
  /** 当前实例的配置参数 */
  $opts: SmartFetchOptions
}

export interface RequestExtraArgs {
  /** 使用那个key对应的基础配置 */
  useCore?: string
  /** 数据的编码方式 */
  enctype?: EnctypeType
  /** 非get/head方式希望在地址上传递参数可以使用，也可以直接用config对象形式 */
  params?: any
}

interface RequestExtraArgsWithReturnLink extends RequestExtraArgs {
  /** 是否只返回链接地址 */
  returnLink?: boolean
}

export default function (context: RequestContext) {
  /** get request url link */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data: P | undefined,
    method: Extract<Method, 'GET' | 'HEAD'>,
    returnLinkOrExtra: true | (RequestExtraArgs & { returnLink: true })
  ): string
  /** get request config object */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data?: P,
    method?: Method,
    extra?: RequestExtraArgs
  ): RequestConfig

  /** get request config data */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data?: P,
    method: Method = 'GET',
    returnLinkOrExtra?: true | RequestExtraArgsWithReturnLink
  ) {
    const { useFetch, baseCfgs, $opts } = context
    const { useCore, returnLink, enctype, params } = {
      useCore: 'default',
      enctype: 'json',
      ...(returnLinkOrExtra === true ? { returnLink: true } : returnLinkOrExtra)
    } as Required<RequestExtraArgsWithReturnLink>

    method = urlMethod.includes(method) ? method : 'GET'
    const isNoBody = ['GET', 'HEAD'].includes(method)

    // return link url
    if (returnLink === true) {
      if (!isNoBody) {
        console.error('cannot return url link when method is not GET or Head')
        return ''
      }
      const baseCfg =
        baseCfgs && baseCfgs[useCore] ? baseCfgs[useCore] : undefined
      const { baseData } = $opts

      const isFormData = data instanceof FormData
      const handleData = {
        ...(baseData instanceof Function ? baseData(useCore) : {}),
        ...(isFormData ? {} : (data as SerializableObject))
      }
      return returnRequestLink(url, handleData, baseCfg)
    }

    const result: RequestConfig = {
      url,
      method: (useFetch ? method : method.toLowerCase()) as Method,
      ...(isNoBody ? { params: data } : { data }),
      ...(params ? { params } : {})
    }
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

  return createRequestConfig
}
