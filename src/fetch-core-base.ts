import { filterNullable, switchNullToUndefined, wp } from '@wxhccc/es-util'
import {
  FetchOptions,
  FetchRequestContext,
  RequestConfig,
  SerializableObject
} from './types'
import { createError, createHangOnState } from './utils'
import winFetch from './win-fetch'

type FetchApi<T> = (
  context: FetchRequestContext,
  config: RequestConfig
) => Promise<T>

const hangOnState = createHangOnState()
let hangOnPromise: Promise<'sucess' | 'fail'> | undefined

export const smartFetchCoreCreator = <
  T extends SerializableObject = SerializableObject
>(
  fetchCore: FetchApi<T>
) => {
  return <DataType = any>(
    context: FetchRequestContext,
    reqConfig: RequestConfig,
    options: FetchOptions = {}
  ) => {
    const {
      useFetch,
      useConfig,
      options: cfgOptions,
      mergeConfigData
    } = context
    const {
      responseCodeCheck: resCodeCheck,
      dataKey,
      switchDataNull: optSwitchDataNull,
      paramsFilterNullable: optParamsFilterNullable
    } = cfgOptions || {}
    let resData: SerializableObject | null = null

    const opts: FetchOptions = {
      needCodeCheck: !!resCodeCheck,
      silence: false,
      switchDataNull: optSwitchDataNull,
      paramsFilterNullable: optParamsFilterNullable,
      ...options
    }
    const { lock, paramsFilterNullable, switchDataNull, ignoreStatusHandle } =
      opts

    const getMergeReqConfig = () => {
      const config = mergeConfigData(reqConfig, useConfig)
      if (paramsFilterNullable && config.params) {
        config.params = filterNullable(config.params)
      }
      return config
    }

    let handleConfig = getMergeReqConfig()

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
        resData = resjson
        throw createError('CodeError', undefined, 'code checked failed')
      } else {
        return resjson
      }
    }
    // 处理返回数据，根据配置的key返回数据中的制定字段，一般是data
    const handleResData = (resjson: SerializableObject) => {
      return dataKey ? resjson[dataKey] : resjson
    }

    const createRequest = async (): Promise<T | DataType | undefined> => {
      if (!handleConfig || typeof handleConfig.url !== 'string') {
        throw createError('ConfigError', undefined, 'smartfetch: no valid url')
      }
      try {
        const resJson = await fetchCore(context, reqConfig)
        if (!resJson) {
          return
        }
        const data = opts.needCodeCheck
          ? (handleResData(codeCheck(resJson as T)) as DataType)
          : resJson
        const handleData = switchDataNull ? switchNullToUndefined(data) : data
        return handleData
      } catch (err) {
        const result = await handleError(err as Error)
        if (result instanceof Error) {
          throw result
        }
        return result as DataType | T
      }
    }

    const handleError = async (error: Error & { response?: Response }) => {
      let msg = ''
      const {
        statusHandler,
        errorHandler,
        codeErrorHandler,
        statusWarn = {}
      } = cfgOptions || {}
      if (
        (useFetch && error instanceof TypeError) ||
        error.message === 'Network Error'
      ) {
        msg = '服务器未响应'
      } else if (error instanceof SyntaxError) {
        msg = '数据解析失败'
      } else if (error instanceof RangeError || error.response) {
        error.response && (context.__response = error.response)
        const { status } = context.__response || ({} as Response)
        if (!ignoreStatusHandle && typeof statusHandler === 'function') {
          const { state, hangOnBefore, switchStatus } = hangOnState
          if (!hangOnPromise) {
            const ret = statusHandler(status, error, handleConfig)
            // 如果状态检查函数返回的是promise对象，则设置等待状态，其他的请求需等待第一个promise返回结果
            if (ret instanceof Promise) {
              if (!state.status) {
                switchStatus('waiting')
                hangOnPromise = hangOnBefore()
                try {
                  await ret
                  switchStatus('sucess')
                } catch (e) {
                  switchStatus('fail')
                }
              }
            }
          }
          if (hangOnPromise) {
            const result = await hangOnPromise
            switchStatus()
            hangOnPromise = undefined
            if (result === 'sucess') {
              handleConfig = getMergeReqConfig()
              return createRequest()
            }
          }
        }
        msg = (status && statusWarn[status]) || '请求失败'
      }

      if (opts.silence) {
        return error
      }

      if (error.name === 'CodeError' && codeErrorHandler instanceof Function) {
        codeErrorHandler(resData as SerializableObject)
      } else if (errorHandler instanceof Function) {
        errorHandler(msg, error, context.__response || undefined)
      } else {
        typeof window.alert === 'function' ? alert(msg) : console.error(error)
      }
      return error
    }

    return wp(() => createRequest(), { wrap: true, lock })
  }
}

export const smartFetchCore = smartFetchCoreCreator(winFetch)
