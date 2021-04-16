import axios, { AxiosInstance } from 'axios';
import SmartFetchCore from './smart-api';
import SFRequest, { CreateRequestConfig } from './request';
import { BaseConfig, BaseConfigs, FetchCore, RequestConfig, SmartFetchOptions } from './types';
import { AppContext } from 'vue'
import { VueConstructor } from 'vue2/types/vue';

const { hasOwnProperty, toString } = Object.prototype
const objType = (val: object) => {
  const typeKeys = toString.call(val).match(/^\[object (.*)\]$/)
  return typeKeys ? typeKeys[1] : ''
}

type RequestFn = (...args: any) => RequestConfig

function checkContext (context: any) {
  if (context._isVue || (context.$ && context.$.vnode)) {
    return 'vue';
  }
  else if ('setState' in context) {
    return 'react';
  }
  return 'default'
}

// function fetchArgsSwitch (config: RequestConfig): RequestConfig
// function fetchArgsSwitch (...args: Parameters<CreateRequestConfig>): RequestConfig
// function fetchArgsSwitch (requestFn: RequestFn, ...args: Parameters<typeof requestFn>): RequestConfig
function fetchArgsSwitch (...args: any[]): RequestConfig {
  const firstArg = args[0]
  if (typeof firstArg === 'string') {
    return request(...args as Parameters<CreateRequestConfig>) as RequestConfig;
  } else if (typeof firstArg === 'function') {
    return firstArg(...args.slice(1));
  }
  return {};
}

function fetchContextMethod(instance: SmartFetch) {
  return function (this: any, ...args: any[]) {
    const instanceType = checkContext(this);
    const config = args.length ? fetchArgsSwitch(...args) : {};
    const context = instanceType ? this : (self || window || global)
    context && instanceType === 'default' && !hasOwnProperty.call(context, '$_SF_KEYS') && (context.$_SF_KEYS = {});
    return new SmartFetchCore(instance, context, config, instanceType).$promise;
  }
}

export class SmartFetch {
  private _fetchEnable = false;
  private _useFetch: boolean = true;
  get useFetch () { return this._useFetch }
  private _axiosCores: Record<string, AxiosInstance> = Object.create(null);
  get axiosCores () { return this._axiosCores }
  private _baseCfgs: Record<string, BaseConfig> = Object.create(null);
  get baseConfigs () { return this._baseCfgs }
  private _statusMsgs: { [key: string]: string } = Object.create(null);
  get statusMsgs () { return this._statusMsgs }
  public $core!: FetchCore;
  public $curCfg: BaseConfig = Object.create(null)

  private _options = {} as SmartFetchOptions
  get options () { return this._options }

  constructor (options?: SmartFetchOptions) {
    this.resetOpts(options);
    this._fetchCoreChoose(!!(options && options.forceAxios));
  }

  private _fetchCoreChoose (forceAxios?: boolean) {
    this._fetchEnable = (typeof fetch === 'function');
    this._ajaxCoreSwitch(forceAxios || !this._fetchEnable);
  }

  private _ajaxCoreSwitch (useAxios: boolean) {
    Object.assign(this, {
      _useFetch: !useAxios,
      $core: useAxios ? axios : fetch.bind(window || global)
    })
  }

  private _fetchCoreSetup (baseConfigs: BaseConfigs) {
    const { _axiosCores, _baseCfgs, _useFetch } = this;

    const configs = Array.isArray(baseConfigs)
      ? baseConfigs.length ? baseConfigs : [{ key: 'default' }]
      : [{ key: 'default', ...baseConfigs }];
    configs.forEach(item => {
      const newItem = Object.assign({}, item)
      const { key } = newItem;
      if (key) {
        delete newItem.key;
        _baseCfgs[key] = newItem
        !_useFetch && (_axiosCores[key] = axios.create(item));
      }
    })
    this.$curCfg = _baseCfgs['default'];
    !_useFetch && (this.$core = _axiosCores['default']);
  }
  

  public fetch = fetchContextMethod(this)
  // init the core of ajax, set default config
  
  // for Vue.use method of vuejs 
  public install (appOrVue: AppContext | VueConstructor, options: SmartFetchOptions) {
    options && (options instanceof Object) && this.resetOpts(options);
    if ('globalProperties' in appOrVue.config) {
      (appOrVue as AppContext).config.globalProperties.$fetch = this.fetch;
    } else {
      (appOrVue as VueConstructor).prototype.$fetch = this.fetch
    }
  }

  // modify base configs
  public modifyBaseConfigs (handler: (baseConfigs: Record<string, BaseConfig>) => never) {
    if (typeof handler === 'function') handler(this._baseCfgs)
  }
  // reset options
  public resetOpts (options = {} as SmartFetchOptions) {
    if (!options && objType(options) !== 'Object') return;
    Object.assign(this._options, options);
    this._ajaxCoreSwitch(!!options.forceAxios);
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    options.baseConfigs && this._fetchCoreSetup(options.baseConfigs);
  }

}

const rootInstance = new SmartFetch();

export const request = SFRequest(rootInstance)
 
export default rootInstance;


