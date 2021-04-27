import axios, { AxiosInstance, Method } from 'axios'
import smartFetchCore from './smart-api'
import SFRequest from './request'
import {
  BaseConfig,
  BaseConfigs,
  ContextType,
  FetchCore,
  RequestConfig,
  RequestData,
  SFetch,
  SmartFetchOptions
} from './types'
export * from './types'
import { has, objType } from './utils'

function checkContext(context?: any): ContextType {
  if (!context) return 'unknown'
  if (context._isVue || (context.$ && context.$.vnode)) {
    return 'vue'
  } else if ('setState' in context) {
    return 'react'
  }
  return 'unknown'
}

function fetchContextMethod(instance: SmartFetch) {
  const fetch: SFetch = function (
    this: any,
    configOrUrl: RequestConfig | string,
    data?: RequestData,
    method?: Method
  ) {
    const instanceType = checkContext(this)
    const config =
      typeof configOrUrl === 'string'
        ? (request(configOrUrl, data, method) as BaseConfig)
        : configOrUrl || {}
    const context = instanceType !== 'unknown' ? this : self || window || global
    context &&
      instanceType === 'unknown' &&
      !has(context, '$_SF_KEYS') &&
      (context.$_SF_KEYS = {})
    return smartFetchCore(instance, context, config, instanceType)
  }
  return fetch
}

export class SmartFetch {
  private _fetchEnable = false
  private _useFetch = true
  get useFetch() {
    return this._useFetch
  }
  private _axiosCores: Record<string, AxiosInstance> = Object.create(null)
  get axiosCores() {
    return this._axiosCores
  }
  private _baseCfgs: Record<string, BaseConfig> = Object.create(null)
  get baseConfigs() {
    return this._baseCfgs
  }
  private _statusMsgs: { [key: string]: string } = Object.create(null)
  get statusMsgs() {
    return this._statusMsgs
  }
  public $core!: FetchCore
  public $curCfg: BaseConfig = Object.create(null)

  private _options = {} as SmartFetchOptions
  get options() {
    return this._options
  }

  constructor(options?: SmartFetchOptions) {
    this.resetOptions(options)
    this._fetchCoreChoose(!!(options && options.forceAxios))
  }

  private _fetchCoreChoose(forceAxios?: boolean) {
    this._fetchEnable = typeof fetch === 'function'
    this._ajaxCoreSwitch(forceAxios || !this._fetchEnable)
  }

  private _ajaxCoreSwitch(useAxios: boolean) {
    Object.assign(this, {
      _useFetch: !useAxios,
      $core: useAxios ? axios : fetch.bind(window || global)
    })
  }

  private _fetchCoreSetup(baseConfigs: BaseConfigs) {
    const { _axiosCores, _baseCfgs, _useFetch } = this

    const configs = Array.isArray(baseConfigs)
      ? baseConfigs.length
        ? baseConfigs
        : [{ key: 'default' }]
      : [{ key: 'default', ...baseConfigs }]
    configs.forEach((item) => {
      const newItem = Object.assign({}, item)
      const { key } = newItem
      if (key) {
        delete (newItem as BaseConfig).key
        _baseCfgs[key] = newItem
        !_useFetch && (_axiosCores[key] = axios.create(item))
      }
    })
    this.$curCfg = _baseCfgs['default']
    !_useFetch && (this.$core = _axiosCores['default'])
  }

  public fetch = fetchContextMethod(this)
  // init the core of ajax, set default config

  // for Vue.use method of vuejs
  public install(appOrVue: any, options: SmartFetchOptions) {
    options && options instanceof Object && this.resetOptions(options)
    if ('globalProperties' in appOrVue.config) {
      appOrVue.config.globalProperties.$fetch = this.fetch
    } else {
      appOrVue.prototype.$fetch = this.fetch
    }
  }

  // modify base configs
  public modifyBaseConfigs(
    handler: (baseConfigs: Record<string, BaseConfig>) => never
  ) {
    if (typeof handler === 'function') handler(this._baseCfgs)
  }
  // reset options
  public resetOptions(options: SmartFetchOptions = {}, notAssign?: boolean) {
    if (!options && objType(options) !== 'Object') return
    this._options = notAssign ? options : { ...this._options, ...options }
    this._ajaxCoreSwitch(!!options.forceAxios)
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    options.baseConfigs && this._fetchCoreSetup(options.baseConfigs)
  }
}

const rootInstance = new SmartFetch()

export const request = SFRequest(rootInstance)

export default rootInstance
