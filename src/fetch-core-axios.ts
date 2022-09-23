import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { CoreErrorHandler, smartFetchCoreCreator } from './index-fetch'
import { FetchRequestContext, RequestConfig, SerializableObject } from './types'

const axiosCore = async <T>(
  context: FetchRequestContext,
  config: AxiosRequestConfig
) => {
  const response: AxiosResponse<T> = await axios(config)
  context.__response = response as unknown as Response
  return response.data
}

const axiosErrorHandlers: CoreErrorHandler<AxiosError>[] = [
  [
    (error, useFetch) => !useFetch && error.code === 'ERR_NETWORK',
    (msg) => (msg.value = '服务器未响应')
  ],
  [
    (error, useFetch) => !useFetch && !!error.response,
    async (msg, error, context, utils) => {
      context.__response = error.response as unknown as Response
      const { statusWarn = {} } = context.options
      const { status } = context.__response
      const result = await utils.handleStatusError(status)
      if (result) {
        return result
      }
      msg.value = statusWarn[status] || '请求失败'
    }
  ]
]

const smartFetchAxiosCore = smartFetchCoreCreator<
  SerializableObject,
  AxiosRequestConfig
>(axiosCore, axiosErrorHandlers as CoreErrorHandler[])

export default smartFetchAxiosCore
