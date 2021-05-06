import { AxiosError, AxiosInstance, AxiosResponse, ResponseType } from 'axios'
import { awaitWrapper, PromiseWithLock, wp } from '@wxhccc/es-util'
import { SmartFetch } from './index'
import {
  ContextType,
  FaileHandle,
  FetchOptions,
  FetchResponse,
  LockSwitchHook,
  PromiseWithMethods,
  RequestConfig,
  SerializableObject,
  SyncRefHandle,
  WinFetch
} from './types'

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

export default function smartFetchCore<DataType = any>(
  rootInstance: SmartFetch,
  context: any,
  config: RequestConfig,
  options?: FetchOptions
) {
  const $root: SmartFetch = rootInstance
  let usingCore = rootInstance.$core
  let useBaseCfg = rootInstance.$curCfg
  let _response: FetchResponse | null = null
  let _resJson: SerializableObject | null = null

  const opts: FetchOptions = {
    needCodeCheck: !!rootInstance.options.responseCheck,
    silence: false,
    ...options
  }
  let fetchConfig: RequestConfig = {}
  const silence = false
  let failHandler: FaileHandle

  const axiosRequest = (config: RequestConfig) => {
    const axiosInstanc = usingCore as AxiosInstance
    return axiosInstanc(config).then(axiosResStatusCheck)
  }
  const axiosResStatusCheck = (response: AxiosResponse) => {
    _response = response
    return response.data
  }

  const switchUseCore = (corekey: string) => {
    if (corekey && typeof corekey === 'string' && $root.baseConfigs[corekey]) {
      useBaseCfg = $root.baseConfigs[corekey]
      !$root.useFetch && (usingCore = $root.getAxiosCore(corekey))
    }
  }

  const createRequest = (
    config: RequestConfig
  ): PromiseWithMethods<DataType | [null, DataType] | [Error, undefined]> => {
    let reqCorePromise: Promise<any> | (() => Promise<any>)
    const thenQueue: any[] = []
    if (!config || typeof config.url !== 'string') {
      reqCorePromise = Promise.reject(
        new Error('smartfetch: no valid url')
      ).catch(handleError)
    } else {
      checkRequestCore(config)
      reqCorePromise = () =>
        Promise.resolve().then(() => {
          const promise = ($root.useFetch
            ? request(config)
            : axiosRequest(config)
          )
            .then(codeCheck)
            .then(handleResData)
          const customPro = thenQueue.length
            ? thenQueue.reduce((acc, item) => acc.then(item), promise)
            : promise.then((data) => [null, data])
          return customPro.catch(handleError)
        })
    }
    const reqPromise = wp(reqCorePromise) as PromiseWithLock<any>
    const proxyPromise: PromiseWithMethods<any> = Object.assign(reqPromise, {
      done: <T>(
        onfulfilled?: ((value: any) => T | PromiseLike<T>) | null | undefined
      ) => {
        thenQueue.push(onfulfilled)
        return proxyPromise
      },
      faile: (handler: FaileHandle) => {
        opts.failHandler = handler
        return reqPromise
      },
      useCore: (corekey: string) => {
        corekey && switchUseCore(corekey)
        return proxyPromise
      },
      silence: () => {
        opts.silence = true
        return proxyPromise
      },
      notCheckCode: () => {
        opts.needCodeCheck = false
        return proxyPromise
      }
    })
    return proxyPromise
  }
  const checkRequestCore = (config: RequestConfig) => {
    if (!config.useCore || typeof config.useCore !== 'string') return
    switchUseCore(config.useCore)
    delete config.useCore
  }
  const request = (config: RequestConfig) => {
    const { baseURL, headers } = useBaseCfg || {}
    if (!config.url) config.url = ''
    if (baseURL && (config.url || '').indexOf('http') < 0) {
      config.url = baseURL + config.url
    }
    headers && (config.headers = { ...config.headers, ...headers })
    fetchConfig = Object.assign({}, defOpts, config)
    return ($root.$core as WinFetch)(config.url, fetchConfig)
      .then(resStatusCheck)
      .then(typeHandle)
  }
  const handleResData = (resjson: SerializableObject) => {
    const { dataKey } = $root.options
    return dataKey ? resjson[dataKey] : resjson
  }

  const typeHandle = (response: Response) => {
    const { responseType } = fetchConfig
    const mixFn = responseMixin[responseType as ResponseType]
    return mixFn && typeof response[mixFn] === 'function'
      ? response[mixFn]()
      : undefined
  }

  const resStatusCheck = (response: Response) => {
    _response = response
    const { validateStatus } = $root.options
    if (validateStatus ? validateStatus(response.status) : response.ok) {
      return response
    }
    throw new Error(`Request failed with status code ${response.status}`)
  }

  const handleError = (error: Error & AxiosError) => {
    if (typeof failHandler === 'function') failHandler(error)
    if (silence) return [error, undefined]

    let msg = ''
    const {
      statusMsgs,
      options: { errorHandler, codeErrorHandler },
      useFetch
    } = $root
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
      msg = (status && statusMsgs[status]) || '请求失败'
    }
    if (error.name === 'CodeError' && typeof codeErrorHandler === 'function') {
      codeErrorHandler(_resJson as SerializableObject)
    } else if (typeof errorHandler === 'function') {
      errorHandler(msg, error, _response || undefined)
    } else {
      typeof alert === 'function' ? alert(msg) : console.error(error)
    }
    return [error, undefined]
  }

  const resOkCheck = (resjson: SerializableObject) => {
    let result = false
    const { responseCheck } = $root.options
    if (typeof responseCheck === 'function') {
      result = responseCheck(resjson)
    } else if (typeof responseCheck === 'string') {
      result = !!resjson[responseCheck]
    }
    return result
  }
  const codeCheck = (resjson: SerializableObject) => {
    if (opts.needCodeCheck && !resOkCheck(resjson)) {
      _resJson = resjson
      throw createError('CodeError', undefined, 'code checked failed')
    } else {
      return resjson
    }
  }

  const reqPromise = createRequest(config)
  return reqPromise
}
