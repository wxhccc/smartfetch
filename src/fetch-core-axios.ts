import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { smartFetchCoreCreator } from './index-fetch'
import { FetchRequestContext, RequestConfig, SerializableObject } from './types'

const axiosCore = async <T>(
  context: FetchRequestContext,
  config: AxiosRequestConfig
) => {
  const response: AxiosResponse<T> = await axios(config)
  context.__response = response as unknown as Response
  return response.data
}

const smartFetchAxiosCore = smartFetchCoreCreator<SerializableObject, AxiosRequestConfig>(axiosCore)

export default smartFetchAxiosCore
