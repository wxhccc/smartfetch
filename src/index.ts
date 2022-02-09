import axios, { AxiosInstance, Method } from 'axios'
import smartFetchCore from './smart-api'
import SFRequest from './request'
import {
  BaseConfig,
  BaseConfigs,
  FetchCore,
  FetchOptions,
  RequestConfig,
  RequestData,
  SFetch,
  SmartFetchOptions
} from './types'
import { objType } from './utils'

export { wp } from '@wxhccc/es-util'

export function smartFetchCreator(options?: SmartFetchOptions) {
  let fetchEnable = false
  let useFetch = true

  const baseCfgs: Record<string, BaseConfig> = Object.create(null)

  let $core: FetchCore = fetch.bind(window || global)

  let $options = {} as SmartFetchOptions

  const getOptions = () => Object.freeze($options)

  /**
   * 是否强制使用axios作为核心
   * @param useAxios
   */
  const ajaxCoreSwitch = (useAxios: boolean) => {
    useFetch = !useAxios
    $core = useAxios ? axios : fetch.bind(window || global)
  }

  /**
   * 设置请求处理核心
   * @param baseConfigs 配置项
   */
  const switchConfigsToMap = (baseConfigs: BaseConfigs) => {
    const configs =
      Array.isArray(baseConfigs) && baseConfigs.length
        ? baseConfigs
        : [{ key: 'default', ...baseConfigs }]
    configs.forEach((item) => {
      const newItem = Object.assign({}, item)
      const { key } = newItem
      if (key) {
        delete (newItem as BaseConfig).key
        baseCfgs[key] = newItem
      }
    })
  }
  /**
   * reset options
   * @param options 配置对象
   * @param notAssign 是否不合并，不合并会替换
   * @returns
   */
  const resetOptions = (
    options: SmartFetchOptions = {},
    notAssign?: boolean
  ) => {
    if (!options && objType(options) !== 'Object') return
    $options = notAssign ? options : { ...$options, ...options }
    const { forceAxios, baseConfigs } = options
    ajaxCoreSwitch(!!forceAxios)
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    baseConfigs && switchConfigsToMap(baseConfigs)
  }

  const fetchCoreChoose = (forceAxios?: boolean) => {
    fetchEnable = typeof fetch === 'function'
    ajaxCoreSwitch(forceAxios || !fetchEnable)
  }

  // modify base configs
  const modifyBaseConfigs = (
    handler: (baseConfigs: Record<string, BaseConfig>) => void
  ) => {
    if (handler instanceof Function) {
      handler(baseCfgs)
    }
  }

  const request = SFRequest({ useFetch, baseCfgs, $opts: $options })

  const coreFetch: SFetch = function <
    T = any,
    P extends Record<string, any> = RequestData
  >(
    configOrUrl: RequestConfig | string,
    dataOrOptions?: P | FetchOptions,
    method?: Method,
    options?: FetchOptions
  ) {
    let config: RequestConfig
    if (typeof configOrUrl === 'string') {
      config = request(
        configOrUrl,
        dataOrOptions as RequestData,
        method
      ) as RequestConfig
    } else {
      config = configOrUrl || {}
      options = dataOrOptions
    }
    const { useCore = 'default' } = options || {}
    const context = {
      useFetch,
      core: $core,
      useCore,
      coreCfg: baseCfgs[useCore],
      $opts: $options
    }
    return smartFetchCore<T>(context, config, options)
  }

  const { forceAxios = false } = options || {}

  resetOptions(options)
  fetchCoreChoose(forceAxios)

  // init the core of ajax, set default config

  return {
    $core: () => $core,
    resetOptions,
    modifyBaseConfigs,
    fetch: coreFetch,
    request,
    getOptions
  }
}

const instance = smartFetchCreator()

export const request = instance.request

export default instance

export * from './types'
