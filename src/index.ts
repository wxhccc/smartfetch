import { fetchApiWrapper, smartFetchCreator as winSmartFetchCreator } from './index-fetch'
import smartFetchAxiosCore from './fetch-core-axios'
import { AxiosRequestConfig, SmartFetchMixedRootOptions, AxiosError } from './types-axios'
export * from './index-fetch'

export * from './types-axios'

export function smartFetchCreator(options?: SmartFetchMixedRootOptions) {
  const instance = winSmartFetchCreator<SmartFetchMixedRootOptions>(options)

  const { coreFetchCreator } = instance

  const axiosFetch = coreFetchCreator<AxiosRequestConfig, AxiosError>(smartFetchAxiosCore as any)

  return {
    ...instance,
    axiosFetch
  }
}

const instance = smartFetchCreator()

export const {
  createRequestConfig,
  returnRequestLink,
  modifyBaseConfigs,
  fetch: winFetch,
  axiosFetch,
  resetOptions
} = instance

export const defineAxiosApi = fetchApiWrapper(axiosFetch)

export default instance
