import { AxiosError, AxiosInstance, ResponseType } from 'axios'
import { LockSwitchHook, SyncRefHandle, wp } from '@wxhccc/es-util'
import { SmartFetch } from './index'
import {
  FaileHandle,
  FetchOptions,
  FetchResponse,
  FetchReturn,
  RequestConfig,
  SerializableObject,
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

type Onfulfilled<T = any> =
  | ((value: any) => T | PromiseLike<T>)
  | null
  | undefined

function createError(name: string, error?: Error, message?: string) {
  error = error instanceof Error ? error : new Error()
  error.name = name
  message && (error.message = message)
  return error
}

export default function smartFetchCore<DataType = SerializableObject>(
  rootInstance: SmartFetch,
  context: any,
  config: RequestConfig,
  options: FetchOptions = {}
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

  const switchUseCore = (corekey: string) => {
    if (corekey && typeof corekey === 'string' && $root.baseConfigs[corekey]) {
      useBaseCfg = $root.baseConfigs[corekey]
      !$root.useFetch && (usingCore = $root.getAxiosCore(corekey))
    }
  }
  // axios request
  const axiosRequest = async (config: RequestConfig) => {
    const axiosRes = await (usingCore as AxiosInstance)(config)
    _response = axiosRes
    return axiosRes.data
  }
  // window.fetch request
  const request = async (config: RequestConfig) => {
    const { baseURL, headers } = useBaseCfg || {}
    if (!config.url) config.url = ''
    if (baseURL && (config.url || '').indexOf('http') < 0) {
      config.url = baseURL + config.url
    }
    headers && (config.headers = { ...config.headers, ...headers })
    fetchConfig = Object.assign({}, defOpts, config)

    const resStatusCheck = (response: Response) => {
      _response = response
      const { validateStatus } = $root.options
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
    const res = await ($root.$core as WinFetch)(config.url, fetchConfig)
    return typeHandle(resStatusCheck(res))
  }

  const checkRequestCore = (config: RequestConfig) => {
    if (!config.useCore || typeof config.useCore !== 'string') return
    switchUseCore(config.useCore)
    delete config.useCore
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
    if (!resOkCheck(resjson)) {
      _resJson = resjson
      throw createError('CodeError', undefined, 'code checked failed')
    } else {
      return resjson
    }
  }

  const handleResData = (resjson: SerializableObject) => {
    const { dataKey } = $root.options
    return dataKey ? resjson[dataKey] : resjson
  }

  const createRequest = (config: RequestConfig) => {
    const thenQueue: Onfulfilled[] = []

    const sendFetch = () => {
      checkRequestCore(config)
      const reqPromise = async () => {
        try {
          if (!config || typeof config.url !== 'string') {
            throw createError(
              'ConfigError',
              undefined,
              'smartfetch: no valid url'
            )
          }
          const resJson = await ($root.useFetch
            ? request(config)
            : axiosRequest(config))
          const data = opts.needCodeCheck
            ? handleResData(codeCheck(resJson))
            : resJson
          if (thenQueue.length) {
            const cusData = await thenQueue.reduce(
              (acc, item) => acc.then(item),
              Promise.resolve(data)
            )
            return [null, cusData]
          }
          return [null, data]
        } catch (e) {
          return handleError(e)
        }
      }
      return wp.call(context, reqPromise, {
        lock: opts.lock
      })
    }
    // if offer lock through options, will lock promise sync

    const reqCorePromise = options.lock
      ? sendFetch()
      : Promise.resolve().then(sendFetch)
    const proxyPromise = Object.assign(reqCorePromise, {
      done: <T>(onfulfilled?: Onfulfilled<T>) => {
        thenQueue.push(onfulfilled)
        return proxyPromise
      },
      faile: (handler: FaileHandle) => {
        opts.failHandler = handler
        return reqCorePromise
      },
      useCore: (corekey: string) => {
        corekey && switchUseCore(corekey)
        return proxyPromise
      },
      lock: (
        keyOrHookOrRef: string | LockSwitchHook | SyncRefHandle,
        syncRefHandle?: SyncRefHandle
      ) => {
        opts.lock = keyOrHookOrRef
        syncRefHandle && (opts.syncRefHandle = syncRefHandle)
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
    return proxyPromise as FetchReturn<DataType>
  }

  const handleError = (error: Error & AxiosError): [Error, undefined] => {
    if (typeof opts.failHandler === 'function') opts.failHandler(error)
    if (opts.silence) return [error, undefined]

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

  return createRequest(config)
}
