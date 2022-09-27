import { TIMEOUT_ERROR } from './const'
import { FetchRequestContext, HangOnState, HangOnStatus, SerializableObject } from './types'

const { hasOwnProperty, toString } = Object.prototype

export const has = (val: unknown, key: string) => hasOwnProperty.call(val, key)

export const objType = (val: unknown) => {
  const typeKeys = toString.call(val).match(/^\[object (.*)\]$/)
  return typeKeys ? typeKeys[1] : ''
}

export const isArr = Array.isArray

export const isFormData = (val: unknown): val is FormData => typeof FormData !== 'undefined' && val instanceof FormData 

export const isFn = <T>(
  val: T
): val is T extends (...args: any[]) => any ? T : never =>
  typeof val === 'function'

export const resolveFunctional = <T extends SerializableObject>(
  data?: T | ((...args: any[]) => T),
  ...args: any[]
) => {
  return typeof data === 'function' ? data(...args) : data
}

export function stringify(params: SerializableObject) {
  const parts: string[] = []
  const encode = (val: string | number) =>
    encodeURIComponent(val)
      .replace(/%3A/gi, ':')
      .replace(/%24/g, '$')
      .replace(/%2C/gi, ',')
      .replace(/%20/g, '+')
      .replace(/%5B/gi, '[')
      .replace(/%5D/gi, ']')

  Object.keys(params || {}).forEach((key) => {
    const val = params[key]
    if (val === null || typeof val === 'undefined') return
    const arrVal = isArr(val) ? val : [val]
    if (isArr(val)) key = key + '[]'

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

export function buildUrl(
  url: string,
  params: SerializableObject | URLSearchParams
) {
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

export function appendDataToForm(formdata: FormData, data: SerializableObject) {
  if (!data || !(isFormData(formdata))) return
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

// 请求的状态码错误处理结果
export const createHangOnState = () => {
  let trigger: (value: 'sucess' | 'fail') => void
  let hangOnPromise: Promise<'sucess' | 'fail'> | undefined

  const hangOnBefore = () =>
    new Promise<'fail' | 'sucess'>((resolve) => {
      trigger = resolve
    })
  const switchStatus = (status?: HangOnStatus) => {
    result.status = status
    if (status === 'sucess' || status === 'fail') {
      trigger(status)
    } else if (!status) {
      hangOnPromise = undefined
    }
  }
  const result: HangOnState = {
    status: undefined,
    hangOnPromise: undefined,
    hangOnBefore,
    switchStatus
  }
  return result
}

export const createError = (name: string, message?: string, error?: Error) => {
  error = error instanceof Error ? error : new Error(message)
  error.name = name
  return error
}

export const isFetchTimeout = (error: Error | DOMException, reqInit?: RequestInit) => {
  if (error.name === TIMEOUT_ERROR) {
    return true
  } else if (error instanceof DOMException && error.name === 'AbortError' && reqInit?.signal?.reason?.name.startsWith(TIMEOUT_ERROR)) {
    return true
  }
  return false
}