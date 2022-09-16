import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { smartFetchCoreCreator } from './index-fetch'
import { FetchRequestContext, RequestConfig } from './types'

const axiosCore = async <T>(
  context: FetchRequestContext,
  config: RequestConfig
) => {
  const response = (await axios(
    config as AxiosRequestConfig
  )) as AxiosResponse<T>
  context.__response = response as unknown as Response
  return response.data
}

const smartFetchAxiosCore = smartFetchCoreCreator(axiosCore)

export default smartFetchAxiosCore
