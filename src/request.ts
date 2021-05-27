import { Method } from 'axios'
import {
  BaseConfig,
  RequestConfig,
  RequestData,
  SerializableObject,
  SfRequestConfig
} from './types'
import { objType } from './utils'

const urlMethod: Method[] = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH'
]

type EnctypeType = 'json' | 'urlencode' | 'text' | 'none'

const enctypeType: Partial<Record<EnctypeType, string>> = {
  json: 'application/json',
  urlencode: 'application/x-www-form-urlencoded',
  text: 'text/plain'
}

function stringify(params: SerializableObject) {
  const parts: string[] = []
  const encode = (val: string | number) =>
    encodeURIComponent(val)
      .replace(/%3A/gi, ':')
      .replace(/%24/g, '$')
      .replace(/%2C/gi, ',')
      .replace(/%20/g, '+')
      .replace(/%5B/gi, '[')
      .replace(/%5D/gi, ']')

  Object.keys(params).forEach((key) => {
    const val = params[key]
    if (val === null || typeof val === 'undefined') return
    const arrVal = Array.isArray(val) ? val : [val]
    if (Array.isArray(val)) key = key + '[]'

    arrVal.forEach((v) => {
      if (v instanceof Date) {
        v = v.toISOString()
      } else if (objType(v) === 'Object') {
        v = JSON.stringify(v)
      }
      parts.push(encode(key) + '=' + encode(v as string | number))
    })
  })
  return parts.join('&')
}

function buildUrl(url: string, params: SerializableObject | URLSearchParams) {
  if (!params) return url

  let serializedParams = ''
  if (params instanceof URLSearchParams) {
    serializedParams = params.toString()
  } else {
    serializedParams = stringify(params)
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf('#')
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex)
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }
  return url
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

function appendDataToForm(formdata: FormData, data: SerializableObject) {
  if (!data || !(formdata instanceof FormData)) return
  for (const i in data) {
    if (formdata.has(i)) continue
    const item = data[i]
    if (['Number', 'String', 'Date'].indexOf(objType(item)) > -1) {
      formdata.append(
        i,
        objType(item) === 'Date' ? (item as Date).toISOString() : String(item)
      )
    } else {
      const stringifyData = stringify(item as SerializableObject)
      const slitParams = stringifyData.split('&').map((i) => i.split('='))
      slitParams.forEach(
        ([key, val]) => key && val && formdata.append(key, val)
      )
    }
  }
}

export interface RequestExtraArgs {
  useCore?: string
  enctype?: EnctypeType
}

export default function (config: SfRequestConfig) {
  /** get request config object */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data?: P,
    method?: Method,
    extra?: RequestExtraArgs
  ): RequestConfig<string>
  /** get request url link */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data: P | undefined,
    method: Extract<Method, 'GET' | 'HEAD'>,
    returnLink: true
  ): string

  /** get request config data */
  function createRequestConfig<P extends Record<string, any> = RequestData>(
    url: string,
    data?: P,
    method: Method = 'GET',
    returnLinkOrExtra?: true | RequestExtraArgs
  ) {
    const { useFetch, options, baseConfigs } = config
    const { useCore, enctype } = {
      useCore: 'default',
      enctype: 'json',
      ...(returnLinkOrExtra !== true && returnLinkOrExtra)
    } as Required<RequestExtraArgs>

    method = urlMethod.includes(method) ? method : 'GET'
    const isNoBody = ['GET', 'HEAD'].includes(method)
    const { baseData } = options
    const trueBaseData =
      typeof baseData === 'function' ? baseData(useCore) : baseData
    const isFormData = data instanceof FormData
    const handleData = {
      ...trueBaseData,
      ...(isFormData ? {} : (data as SerializableObject))
    }
    // return link url
    if (returnLinkOrExtra === true) {
      if (!isNoBody) {
        console.error('cannot return url link when method is not GET or Head')
        return ''
      }
      const baseCfg =
        baseConfigs && baseConfigs[useCore] ? baseConfigs[useCore] : undefined
      return returnRequestLink(url, handleData, baseCfg)
    }

    const result: RequestConfig<string> = {
      url,
      method: (useFetch ? method : method.toLowerCase()) as Method,
      useCore
    }
    if (enctype !== 'none')
      result.headers = {
        'Content-Type': (enctypeType[enctype]
          ? enctypeType[enctype]
          : enctypeType['json']) as string
      }
    if (useFetch && enctype !== 'json') result.responseType = 'blob'

    if (!Object.keys(handleData).length) return result
    // query methods
    if (isNoBody) {
      useFetch
        ? (result.url += `?${stringify(handleData)}`)
        : (result.params = data)
      return result
    }
    // request body methods
    // append baseData to formData if data is FormData
    trueBaseData &&
      isFormData &&
      appendDataToForm((data as unknown) as FormData, handleData)
    if (useFetch) {
      result.body = isFormData
        ? ((data as unknown) as FormData)
        : enctype === 'json'
        ? JSON.stringify(data)
        : stringify(data as SerializableObject)
    } else {
      result.data =
        isFormData || enctype === 'json'
          ? data
          : stringify(data as SerializableObject)
    }
    return result
  }

  return createRequestConfig
}
