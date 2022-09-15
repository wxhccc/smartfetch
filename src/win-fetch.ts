import { RequestConfig, FetchRequestContext, SerializableObject } from './types'
import { buildUrl, stringify } from './utils'

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
    timeoutErrorMessage,
    responseType,
    withCredentials,
    ...rest
  } = {
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
      data instanceof FormData
        ? (data as FormData)
        : enctype === 'application/json'
        ? JSON.stringify(data)
        : typeof data === 'string'
        ? data
        : stringify(data as SerializableObject)
  }

  const resStatusCheck = (response: Response) => {
    if (validateStatus ? validateStatus(response.status) : response.ok) {
      return response
    }
    throw new Error(`Request failed with status code ${response.status}`)
  }

  const typeHandle = (response: Response): Promise<T> => {
    return response[responseType]()
  }
  let timeoutId = 0
  const signal: RequestInit = {}
  if (timeout && timeout > 0) {
    const controller =
      typeof window.AbortController !== 'undefined'
        ? new AbortController()
        : null
    controller && (signal.signal = controller.signal)
    timeoutId = window.setTimeout(() => {
      if (controller) {
        controller.abort(timeoutErrorMessage)
      } else {
        throw new Error(timeoutErrorMessage)
      }
    }, timeout)
  }
  const response = await (window || global).fetch(reqUrl, {
    ...fetchConfig,
    ...signal
  })
  window.clearTimeout(timeoutId)
  context.__response = response.clone()
  return typeHandle(resStatusCheck(response))
}
