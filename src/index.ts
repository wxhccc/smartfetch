import {
  smartFetchCreator as winSmartFetchCreator,
  SmartFetchRootOptions
} from './index-fetch'
import smartFetchAxiosCore from './fetch-core-axios'
import { AxiosRequestConfig, FullBaseConfig } from './types-axios'

export * from './index-fetch'

export function smartFetchCreator(options?: SmartFetchRootOptions) {
  const instance = winSmartFetchCreator<FullBaseConfig>(options)

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
  axiosFetch
} = instance

export default instance
