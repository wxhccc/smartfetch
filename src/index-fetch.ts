import { smartFetchCore } from './fetch-core-base'
import SFRequest from './request'
import {
  BaseConfigs,
  BaseConfigWithKey,
  FetchCore,
  FetchOptions,
  FetchRequestContext,
  MappedBaseConfigs,
  Method,
  RequestConfig,
  RequestData,
  SFetch,
  SFetchWithOptions,
  SmartFetchRootOptions
} from './types'
import { objType } from './utils'

export * from './fetch-core-base'

export { wp } from '@wxhccc/es-util'

export const commonSmartFetchCreator = <
  RO = SmartFetchRootOptions,
  CK extends string = string
>(
  options?: RO
) => {
  const baseConfigsMap: MappedBaseConfigs = Object.create(null)

  let $options = {} as RO

  const getOptions = () => Object.freeze($options)

  /**
   * 设置请求处理核心
   * @param baseConfigs 配置项
   */
  const switchConfigsToMap = (baseConfigs: BaseConfigs) => {
    const configs: BaseConfigWithKey[] =
      Array.isArray(baseConfigs) && baseConfigs.length
        ? baseConfigs
        : [{ key: 'default', ...baseConfigs }]
    configs.forEach((item) => {
      const { key, ...rest } = item
      if (key) {
        baseConfigsMap[key] = rest
      }
    })
  }
  /**
   * reset options
   * @param options 配置对象
   * @param notAssign 是否不合并，不合并会替换
   * @returns
   */
  const resetOptions = (options: RO = {} as RO, notAssign?: boolean) => {
    if (!options && objType(options) !== 'Object') return
    $options = notAssign ? options : { ...$options, ...options }
    const { baseConfigs } = options as SmartFetchRootOptions
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    baseConfigs && switchConfigsToMap(baseConfigs)
  }

  // modify base configs
  const modifyBaseConfigs = (
    handler: (baseCfgsMap: MappedBaseConfigs) => void
  ) => {
    if (typeof handler === 'function') {
      handler(baseConfigsMap)
    }
  }

  const { mergeConfigData, createRequestConfig, returnRequestLink } =
    SFRequest<CK>({
      useFetch: true,
      mappedBaseCfgs: baseConfigsMap,
      options: $options as SmartFetchRootOptions
    })

  const coreFetchCreator =
    <RC = RequestConfig>(fetchCore: FetchCore): SFetch<RC> =>
    <T = any, P extends Record<string, any> = RequestData>(
      configOrUrl: RC | string,
      dataOrOptions?: P | FetchOptions,
      method?: Method,
      options?: FetchOptions
    ) => {
      let config: RequestConfig
      if (typeof configOrUrl === 'string') {
        config = createRequestConfig(
          configOrUrl,
          dataOrOptions as RequestData,
          method
        ) as RequestConfig
      } else {
        config = configOrUrl || {}
        options = dataOrOptions
      }
      const { useConfig = 'default' } = options || {}
      const { options: cfgOptions } = baseConfigsMap[useConfig] || {}
      const context: FetchRequestContext = {
        useFetch: true,
        useConfig,
        config: baseConfigsMap[useConfig],
        options: { ...$options, ...cfgOptions },
        mergeConfigData
      }
      return fetchCore<T>(context, config, options)
    }

  options && resetOptions(options)

  return {
    coreFetchCreator,
    mergeConfigData,
    resetOptions,
    modifyBaseConfigs,
    createRequestConfig,
    returnRequestLink,
    getOptions
  }
}

export const smartFetchCreator = <RO = SmartFetchRootOptions>(options?: RO) => {
  const instance = commonSmartFetchCreator(options)

  const { coreFetchCreator } = instance

  const coreFetch = coreFetchCreator(smartFetchCore)

  return {
    ...instance,
    fetch: coreFetch
  }
}

const instance = smartFetchCreator()

export const {
  createRequestConfig,
  returnRequestLink,
  modifyBaseConfigs,
  fetch: winFetch,
  resetOptions
} = instance

export default instance

export const fetchWrap =
  (fetchMethod: SFetch<RequestConfig>) =>
  <T>(configCreator: (...args: unknown[]) => RequestConfig) => {
    const creatorArgsLength = configCreator.length
    return (...args: [...Parameters<typeof configCreator>, FetchOptions]) => {
      const reqConfig = configCreator(...args.slice(0, creatorArgsLength - 1))
      const options = args[creatorArgsLength] as FetchOptions
      return fetchMethod<T>(reqConfig, options)
    }
  }

export * from './types'
