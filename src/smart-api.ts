import { AxiosError, AxiosInstance, ResponseType } from 'axios'
import { filterNullable, switchNullToUndefined } from '@wxhccc/es-util'
import {
  BaseConfig,
  FetchCore,
  FetchOptions,
  FetchResponse,
  FetchReturn,
  RequestConfig,
  SerializableObject,
  SmartFetchOptions,
  WinFetch
} from './types'
import { appendDataToForm, buildUrl, stringify } from './utils'

const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
}

type ResponseBodyMixin = 'json' | 'text' | 'blob' | 'arrayBuffer'
const responseMixin: Partial<Record<ResponseType, ResponseBodyMixin>> = {
  json: 'json',
  text: 'text',
  blob: 'blob',
  arraybuffer: 'arrayBuffer'
}

function createError(name: string, error?: Error, message?: string) {
  error = error instanceof Error ? error : new Error()
  error.name = name
  message && (error.message = message)
  return error
}

interface FetchContext {
  /** 是否使用global.fetch发送请求 */
  useFetch: boolean
  /** 发起请求的核心，global.fetch或axios */
  core: FetchCore
  /** 当前使用的请求配置项的key */
  useCore: string
  /** 当前请求使用的基础配置 */
  coreCfg: BaseConfig
  /** 当前实例的配置参数 */
  $opts: SmartFetchOptions
}

// 请求的状态码错误处理结果
let statusState: 'sucess' | 'fail' | 'waiting' | undefined = undefined

const hangOnBefore = () =>
  new Promise<'fail' | 'sucess'>((resolve) => {
    const checkStatus = () => {
      if (statusState === 'waiting') {
        window.requestAnimationFrame(checkStatus)
      } else {
        resolve(statusState as 'fail' | 'sucess')
      }
    }
    checkStatus()
  })
let hangOnPromise: Promise<'sucess' | 'fail'> | null = null

export default function smartFetchCore<DataType = SerializableObject>(
  context: FetchContext,
  config: RequestConfig,
  options: FetchOptions = {}
) {
  const { useFetch, core, useCore, coreCfg, $opts } = context
  const { responseCodeCheck: resCodeCheck, validateStatus, dataKey, baseData } =
    $opts || {}
  let _response: FetchResponse | null = null
  let _resJson: SerializableObject | null = null

  const opts: FetchOptions = {
    needCodeCheck: !!resCodeCheck,
    silence: false,
    ...options
  }
  const { lock, paramsFilterNullable, switchDataNull } = opts

  const [lockSetter, lockGetter] = Array.isArray(lock)
    ? [typeof lock[0] === 'function' ? lock[0] : () => undefined, lock[1]]
    : [typeof lock === 'function' ? lock : () => undefined]
  const { baseURL, headers: cfgHeaders } = coreCfg || {}

  const handleConfig = { ...config }
  const handleBaseData =
    baseData instanceof Function ? baseData(useCore) : undefined
  const isFormData = handleConfig.data instanceof FormData
  // 如果有基础数据，则合并添加到config对象的对应字段中去
  if (handleBaseData) {
    handleConfig.params = { ...handleBaseData, ...handleConfig.params }
    // 如果是FormData对象，需要将基础数据添加到对象中
    if (isFormData) {
      appendDataToForm(
        (handleConfig.data as unknown) as FormData,
        handleBaseData
      )
    } else {
      handleConfig.data = { ...handleBaseData, ...handleConfig.data }
    }
  }
  // 当前使用的基础配置如果有headers信息，则进行合并
  const mergeBaseCfgHeaders = () => {
    if (cfgHeaders) {
      const headers = cfgHeaders instanceof Function ? cfgHeaders() : cfgHeaders
      handleConfig.headers = { ...headers, ...config.headers }
    }
  }
  mergeBaseCfgHeaders()

  if (paramsFilterNullable && handleConfig.params) {
    handleConfig.params = filterNullable(handleConfig.params)
  }
  // axios request
  const axiosRequest = async () => {
    const axiosRes = await (core as AxiosInstance)({
      ...coreCfg,
      ...handleConfig
    })
    _response = axiosRes
    return axiosRes.data
  }
  // window.fetch request
  const request = async () => {
    const { url = '', params, data, ...rest } = handleConfig
    handleConfig.url = buildUrl(url, params)
    if (baseURL && (handleConfig.url || '').indexOf('http') < 0) {
      handleConfig.url = baseURL + handleConfig.url
    }

    const fetchConfig = { ...defOpts, ...rest }
    const headers = (fetchConfig.headers || {}) as Record<string, string>
    const enctype = headers['Content-Type'] || headers['content-type']
    const { method = 'GET' } = fetchConfig
    const isNoBody = ['get', 'head'].includes(method)
    if (!isNoBody && data) {
      fetchConfig.body = isFormData
        ? ((data as unknown) as FormData)
        : enctype === 'application/json'
        ? JSON.stringify(data)
        : stringify(data as SerializableObject)
    }

    const resStatusCheck = (response: Response) => {
      _response = response
      if (validateStatus ? validateStatus(response.status) : response.ok) {
        return response
      }
      throw new Error(`Request failed with status code ${response.status}`)
    }

    const typeHandle = (response: Response) => {
      const { responseType } = fetchConfig
      const mixFn = responseMixin[responseType as ResponseType]
      return mixFn && typeof response[mixFn] === 'function'
        ? response[mixFn]()
        : undefined
    }
    const res = await (core as WinFetch)(handleConfig.url, fetchConfig)
    return typeHandle(resStatusCheck(res))
  }
  // 检查业务代码是否正常
  const resOkCheck = (resjson: SerializableObject) => {
    let result = false
    if (resCodeCheck instanceof Function) {
      result = resCodeCheck(resjson)
    } else if (typeof resCodeCheck === 'string') {
      result = !!resjson[resCodeCheck]
    }
    return result
  }
  // 业务代码检查，如果需要进行检查且检查结果不通过则抛出错误
  const codeCheck = (resjson: SerializableObject) => {
    if (!resOkCheck(resjson)) {
      _resJson = resjson
      throw createError('CodeError', undefined, 'code checked failed')
    } else {
      return resjson
    }
  }
  // 处理返回数据，根据配置的key返回数据中的制定字段，一般是data
  const handleResData = (resjson: SerializableObject) => {
    return dataKey ? resjson[dataKey] : resjson
  }

  const createRequest = async (): FetchReturn<DataType> => {
    try {
      if (!config || typeof config.url !== 'string') {
        throw createError('ConfigError', undefined, 'smartfetch: no valid url')
      }
      lockSetter(true)
      const resJson = await (useFetch ? request() : axiosRequest())
      const data = opts.needCodeCheck
        ? handleResData(codeCheck(resJson))
        : resJson
      const handleData = switchDataNull ? switchNullToUndefined(data) : data
      lockSetter(false)
      return [null, handleData]
    } catch (e) {
      const result = await handleError(e as Error & AxiosError)
      lockSetter(false)
      return result
    }
  }

  const handleError = async (
    error: Error & AxiosError
  ): FetchReturn<DataType> => {
    if (typeof opts.failHandler === 'function') {
      try {
        opts.failHandler(error)
      } catch (e) {
        console.log(e)
      }
    }

    let msg = ''
    const { statusHandler, errorHandler, codeErrorHandler, statusWarn = {} } =
      $opts || {}
    if (
      (useFetch && error instanceof TypeError) ||
      error.message === 'Network Error'
    ) {
      msg = '服务器未响应'
    } else if (error instanceof SyntaxError) {
      msg = '数据解析失败'
    } else if (error instanceof RangeError || error.response) {
      error.response && (_response = error.response)
      const { status } = _response as Response
      if (statusHandler instanceof Function) {
        if (!hangOnPromise) {
          const ret = statusHandler(status, error, config)
          // 如果状态检查函数返回的是promise对象，则设置等待状态，其他的请求需等待第一个promise返回结果
          if (ret instanceof Promise) {
            if (!statusState) {
              statusState = 'waiting'
              hangOnPromise = hangOnBefore()
              try {
                await ret
                statusState = 'sucess'
              } catch (e) {
                statusState = 'fail'
              }
            }
          }
        }
        if (hangOnPromise) {
          const result = await hangOnPromise
          statusState = undefined
          hangOnPromise = null
          if (result === 'sucess') {
            mergeBaseCfgHeaders()
            return createRequest()
          }
        }
      }
      msg = (status && statusWarn[status]) || '请求失败'
    }

    if (opts.silence) return [error, undefined]

    if (error.name === 'CodeError' && codeErrorHandler instanceof Function) {
      codeErrorHandler(_resJson as SerializableObject)
    } else if (errorHandler instanceof Function) {
      errorHandler(msg, error, _response || undefined)
    } else {
      typeof alert === 'function' ? alert(msg) : console.error(error)
    }
    return [error, undefined]
  }
  if (lockGetter instanceof Function && lockGetter()) {
    return (null as unknown) as FetchReturn<DataType>
  }
  return createRequest()
}
