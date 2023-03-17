import { filterNullable, switchNullToUndefined, wp } from '@wxhccc/es-util'
import { CODE_ERROR, STATUS_ERROR, TIMEOUT_ERROR } from './const'
import {
  FetchOptions,
  FetchRequestContext,
  RequestConfig,
  SerializableObject
} from './types'
import { createError, isArr, isFetchTimeout, isFn } from './utils'
import winFetch from './win-fetch'

export type FetchApi<T, RC = RequestConfig> = (
  context: FetchRequestContext,
  config: RC
) => Promise<T>

type Ref<T> = { value: T }

interface ErrorHandlerUtils {
  handleStatusError: (status: number) => undefined | Promise<any>
}

export type CoreErrorHandler<E extends Error = Error> = [
  (error: E, useFetch?: boolean) => boolean,
  (msgRef: Ref<string>, error: E, context: FetchRequestContext, utils: ErrorHandlerUtils) => any
]

export const smartFetchCoreCreator = <
  T extends SerializableObject = SerializableObject,
  RC = RequestConfig
>(
  fetchCore: FetchApi<T, RC>,
  errorHandlers?: CoreErrorHandler[]
) => {
  return <DataType = any>(
    context: FetchRequestContext,
    reqConfig: RC,
    options: FetchOptions = {}
  ) => {
    const {
      hangOnState,
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
    const { lock, syncRefHandle, paramsFilterNullable, switchDataNull, ignoreStatusHandle } =
      opts

    const getMergeReqConfig = () => {
      const config = mergeConfigData(reqConfig, useConfig) as RequestConfig
      if (paramsFilterNullable && config.params) {
        config.params = filterNullable(config.params)
      }
      return config
    }

    let handleConfig = getMergeReqConfig()

    // 检查业务代码是否正常
    const resOkCheck = (resjson: SerializableObject) => {
      let result = false
      if (isFn(resCodeCheck)) {
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
        throw createError('CodeError', 'code checked failed')
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
        throw createError('ConfigError', 'smartfetch: no valid url')
      }
      try {
        const resJson = await fetchCore(context, handleConfig as RC)
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
      const sysMsg: Ref<string> = { value: '' }
      const {
        statusHandler,
        errorHandler,
        codeErrorHandler,
        statusWarn = {}
      } = cfgOptions || {}

      const handleStatusError = async (status: number) => {
        if (!ignoreStatusHandle && isFn(statusHandler)) {
          const {
            status: queueStatus,
            hangOnBefore,
            switchStatus
          } = hangOnState
          if (!hangOnState.hangOnPromise) {
            const ret = statusHandler(status, error, handleConfig)
            // 如果状态检查函数返回的是promise对象，则设置等待状态，其他的请求需等待第一个promise返回结果
            if (ret instanceof Promise) {
              if (!queueStatus) {
                switchStatus('waiting')
                hangOnState.hangOnPromise = hangOnBefore()
                try {
                  await ret
                  switchStatus('sucess')
                } catch (e) {
                  switchStatus('fail')
                }
              }
            }
          }
          if (hangOnState.hangOnPromise) {
            const result = await hangOnState.hangOnPromise
            switchStatus()
            if (result === 'sucess') {
              handleConfig = getMergeReqConfig()
              return createRequest()
            }
          }
        }
        return
      }
      const errorHandlerQueue: CoreErrorHandler[] = [
        [
          () => useFetch && error instanceof TypeError,
          (msg) => { msg.value = '服务器未响应' }
        ],
        [
          () => useFetch && error instanceof SyntaxError,
          (msg) => { msg.value = '数据解析失败' }
        ],
        [
          () => useFetch && isFetchTimeout(error, context.__fetchConfig),
          (msg) => { msg.value = '请求超时' }
        ],
        [
          () => useFetch && error.name === STATUS_ERROR,
          async (msg) => {
            const { status } = context.__response || ({} as Response)
            const result = await handleStatusError(status)
            if (result) {
              return result
            }
            msg.value = statusWarn[status] || '请求失败'
          }
        ],
        ...(isArr(errorHandlers) ? errorHandlers : [])
      ]
      const utils = { handleStatusError }

      const [, handler] = errorHandlerQueue.find((item) => item[0](error, useFetch)) || []

      const result = handler ? await handler(sysMsg, error, context, utils) : undefined
  
      if (result) {
        return result
      }

      if (opts.silence) {
        return error
      }

      if (error.name === CODE_ERROR && isFn(codeErrorHandler)) {
        codeErrorHandler(resData as SerializableObject)
      } else if (isFn(errorHandler)) {
        errorHandler(sysMsg.value, error, context.__response)
      } else {
        isFn(window.alert) ? alert(sysMsg.value) : console.error(error)
      }
      return error
    }
    return wp(() => createRequest(), { wrap: true, lock, syncRefHandle })
  }
}

export default smartFetchCoreCreator(winFetch)
