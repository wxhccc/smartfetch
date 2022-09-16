import { smartFetchCreator as winSmartFetchCreator } from './index-fetch'
import smartFetchAxiosCore from './fetch-core-axios'
import { AxiosRequestConfig, SmartFetchMixedRootOptions } from './types-axios'

export * from './index-fetch'

export * from './types-axios'

export function smartFetchCreator(options?: SmartFetchMixedRootOptions) {
  const instance = winSmartFetchCreator<SmartFetchMixedRootOptions>(options)

  const { coreFetchCreator } = instance

  const axiosFetch = coreFetchCreator<AxiosRequestConfig>(smartFetchAxiosCore)

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

export default instance
