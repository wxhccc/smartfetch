import { CT_JSON, STATUS_ERROR, TIMEOUT_ERROR } from './const'
import { RequestConfig, FetchRequestContext, SerializableObject } from './types'
import { buildUrl, createError, stringify } from './utils'

/** window.fetch的封装 */
export default async function winFetch<T>(
  context: FetchRequestContext,
  config: RequestConfig
) {
  const { validateStatus } = context.options
  const {
    baseURL,
    url = '',
    params,
    data,
    timeout,
    responseType,
    withCredentials,
    ...rest
  } = {
    headers: { 'content-type': CT_JSON, ...config.headers },
    responseType: 'json' as NonNullable<RequestConfig['responseType']>,
    ...config
  }

  let reqUrl = buildUrl(url, params)
  if (baseURL && !reqUrl.startsWith('http')) {
    reqUrl = baseURL + reqUrl
  }

  const fetchConfig: RequestInit = {
    ...(rest as RequestInit),
    ...(withCredentials !== undefined
      ? { credentials: withCredentials ? 'same-origin' : 'omit' }
      : {})
  }
  const headers = (fetchConfig.headers || {}) as Record<string, string>
  const enctype = headers['Content-Type'] || headers['content-type']
  const { method = 'GET' } = fetchConfig
  const isNoBody = ['get', 'head'].includes(method.toLowerCase())
  if (!isNoBody && data) {
    fetchConfig.body =
      FormData && data instanceof FormData
        ? (data as FormData)
        : enctype === CT_JSON
        ? JSON.stringify(data)
        : typeof data === 'string'
        ? data
        : stringify(data as SerializableObject)
  }

  const resStatusCheck = (response: Response) => {
    if (validateStatus ? validateStatus(response.status) : response.ok) {
      return response
    }
    throw createError(
      STATUS_ERROR,
      `Request failed with status code ${response.status}`
    )
  }

  const typeHandle = async (response: Response): Promise<T> => {
    return response[responseType]()
  }
  let timeoutPromise: Promise<void> | null = null

  if (timeout && timeout > 0) {
    if (typeof window.AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      fetchConfig.signal = (AbortSignal as any).timeout(timeout)
    } else {
      const controller =
        typeof window.AbortController !== 'undefined'
          ? new AbortController()
          : null
      controller && (fetchConfig.signal = controller.signal)
      timeoutPromise = new Promise((_r, reject) => {
        window.setTimeout(() => {
          if (controller) {
            controller.abort(new DOMException('请求超时', TIMEOUT_ERROR))
          } else {
            reject(createError(TIMEOUT_ERROR, '请求超时'))
          }
        }, timeout)
      })
    }
  }
  context.__fetchConfig = fetchConfig
  let response: Response
  const fetchPromise = (window || global).fetch(reqUrl, fetchConfig)
  if (timeoutPromise) {
    ;[response] = await Promise.all([fetchPromise, timeoutPromise])
  } else {
    response = await fetchPromise
  }
  context.__response = response.clone()
  return typeHandle(resStatusCheck(response))
}
