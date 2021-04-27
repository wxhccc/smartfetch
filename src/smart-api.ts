import { AxiosError, AxiosInstance, AxiosResponse, ResponseType } from 'axios'
import { SmartFetch } from './index'
import {
  ContextType,
  FaileHandle,
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

const { hasOwnProperty, toString } = Object.prototype
const isObj = (obj: unknown) => toString.call(obj) === '[object Object]'

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
  contextType: ContextType
) {
  const $root: SmartFetch = rootInstance
  const isReactiveIns = contextType !== 'unknown'
  let usingCore = rootInstance.$core
  let useBaseCfg = rootInstance.$curCfg
  let _response: FetchResponse | null = null
  let _resJson: SerializableObject | null = null
  let needCodeCheck = !!rootInstance.options.responseCheck
  const stateKey = isReactiveIns
    ? contextType === 'react'
      ? 'state'
      : ''
    : '$_SF_KEYS'
  const contextState = stateKey ? context[stateKey] : context

  const asyncLocking = false
  let fetchConfig: RequestConfig = {}
  let silence = false
  let useCoreKey = 'default'
  let lockSwitchHook: LockSwitchHook
  let lockRefHandle: SyncRefHandle
  let lockKey: string[] = []
  let failHandler: FaileHandle

  const axiosRequest = (config: RequestConfig) => {
    const axiosInstanc = $root.$core as AxiosInstance
    return axiosInstanc(config).then(axiosResStatusCheck)
  }
  const axiosResStatusCheck = (response: AxiosResponse) => {
    _response = response
    return response.data
  }

  const switchUseCore = (corekey: string) => {
    if (corekey && typeof corekey === 'string' && $root.baseConfigs[corekey]) {
      useCoreKey = corekey
      useBaseCfg = $root.baseConfigs[corekey]
      !$root.useFetch && (usingCore = $root.axiosCores[corekey])
    }
  }

  const createRequest = (
    config: RequestConfig
  ): PromiseWithMethods<DataType | [null, DataType] | [Error, undefined]> => {
    let reqPromise: Promise<any>
    const thenQueue: any[] = []
    if (!config || typeof config.url !== 'string') {
      reqPromise = Promise.reject(new Error('smartfetch: no valid url')).catch(
        handleError
      )
    } else {
      checkRequestCore(config)
      reqPromise = Promise.resolve().then(() => {
        if (!checkLock()) {
          stateLock(true)
          const promise = ($root.useFetch
            ? request(config)
            : axiosRequest(config)
          )
            .then(codeCheck)
            .then(handleResData)
          const customPro = thenQueue.length
            ? thenQueue.reduce((acc, item) => acc.then(item), promise)
            : promise.then((data) => [null, data])
          return customPro.catch(handleError).finally(() => stateLock(false))
        }
      })
    }
    const proxyPromise: PromiseWithMethods<any> = Object.assign(reqPromise, {
      done: <T>(
        onfulfilled?: ((value: any) => T | PromiseLike<T>) | null | undefined
      ) => {
        thenQueue.push(onfulfilled)
        return proxyPromise
      },
      faile: (handler: FaileHandle) => {
        failHandler = handler
        return reqPromise
      },
      useCore: (corekey: string) => {
        corekey && switchUseCore(corekey)
        return proxyPromise
      },
      lock: <HT extends LockSwitchHook>(
        keyOrHookOrHandle: string | HT | SyncRefHandle,
        syncRefHandle?: SyncRefHandle
      ) => {
        const isRefHandle = (val: unknown): val is SyncRefHandle =>
          Array.isArray(val) && val.length === 2
        if (typeof keyOrHookOrHandle === 'string') {
          lockKey = keyOrHookOrHandle.split('.')
        } else if (isRefHandle(keyOrHookOrHandle)) {
          lockRefHandle = keyOrHookOrHandle
        } else if (typeof keyOrHookOrHandle === 'function') {
          lockSwitchHook = keyOrHookOrHandle
          if (isRefHandle(syncRefHandle)) {
            lockRefHandle = syncRefHandle
          }
        }
        return proxyPromise
      },
      silence: () => {
        silence = true
        return proxyPromise
      },
      notCheckCode: () => {
        needCodeCheck = false
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

  const checkLock = () => {
    return lockKey.length > 0 && getValue(contextState, lockKey)
  }
  const stateLock = (bool: boolean) => {
    if (lockKey.length) return setValue<boolean>(contextState, lockKey, bool)
    if (lockRefHandle) lockRefHandle[0][lockRefHandle[1]] = bool
    if (lockSwitchHook) lockSwitchHook(bool)
  }

  const getValue = (obj: any, path: string[]) => {
    // use refHandle if contextState not update sync
    if (lockRefHandle) return lockRefHandle[0][lockRefHandle[1]]
    let result = false
    if (obj && isObj(obj) && Array.isArray(path)) {
      let curObj = obj
      for (let i = 0; i < path.length; i++) {
        const key = path[i]
        if (typeof curObj !== 'object' || !hasOwnProperty.call(curObj, key)) {
          break
        }
        curObj = curObj[key]
        i === path.length - 1 &&
          (result = typeof curObj === 'boolean' ? curObj : false)
      }
    }
    return result
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
    if (needCodeCheck && !resOkCheck(resjson)) {
      _resJson = resjson
      throw createError('CodeError', undefined, 'code checked failed')
    } else {
      return resjson
    }
  }

  const setValue = <T>(obj: any, path: string[], value: T) => {
    // if vue2 and path[0] not defined, do nothing
    if (
      contextType === 'vue' &&
      context.$set &&
      !hasOwnProperty.call(obj, path[0])
    )
      return

    const {
      $set = (o: any, key: string, val: unknown) => {
        o[key] = val
      }
    } = context
    const isStateRect = contextType === 'react'
    const originObj = isStateRect ? { ...obj } : obj
    let curObj = originObj
    let canSet = false
    for (let i = 0; i < path.length; i++) {
      const key = path[i]
      const keyExist = hasOwnProperty.call(curObj, key)
      if (i === path.length - 1) {
        const isBool = typeof curObj[key] === 'boolean'
        canSet = !keyExist || isBool
        canSet && $set(curObj, key, value)
      } else {
        !keyExist && $set(curObj, key, {})
        if (!isObj(curObj[key])) break
        isStateRect && (curObj[key] = { ...curObj[key] })
        curObj = curObj[key]
      }
    }
    // trigger setState when run in react class component
    isStateRect && canSet && context.setState({ [path[0]]: originObj[path[0]] })
  }

  const reqPromise = createRequest(config)
  return reqPromise
}
