import axios from 'axios';
import SmartApi from './SmartApi';
import SmartApiVue from './SmartApiVue';
import SmartApiReact from './SmartApiReact';
import SARequest from './Request';

const moduleMap = {
  'vue': SmartApiVue,
  'react': SmartApiReact
};
// an export function for easier use

export class SmartFetch {
  constructor (options) {
    const opts = options && (typeof options === 'object') ? options : null
    opts && this.resetOpts(opts);
    this._fetchSupportCheck(opts && opts.forceAxios);
  }
  static SFinfos = {
    useFetch: true,
    axiosCores: Object.create(null),
    baseCfgs: Object.create(null),
    userConfig: Object.create(null),
    statusMsgs: {}
  };
  static checkContext (context) {
    if (context.hasOwnProperty('_isVue')) {
      return 'vue';
    }
    else if (context.hasOwnProperty('state') || context.hasOwnProperty('setState')) {
      return 'react';
    }
  }
  static fetchArgsSwitch (...args) {
    let config = args[0];
    if (typeof config === 'string') {
      config = request(...args);
    } else if (typeof config === 'function') {
      config = config(...args.slice(1));
    }
    return config;
  }
  static fetchCoreSetup (baseConfigs) {
    const { SFinfos, SFinfos: { axiosCores, baseCfgs, useFetch, userConfig } } = this;
    const baseConfig = Array.isArray(baseConfigs) ? baseConfigs : [{ key: 'default', ...baseConfigs }];
    const validateStatus = userConfig && (typeof userConfig.validateStatus === 'function') ? userConfig.validateStatus : null;
    baseConfig.forEach(item => {
      let newItem = Object.assign(validateStatus ? { validateStatus } : {}, item)
      const { key } = newItem;
      if (key) {
        delete newItem.key;
        baseCfgs[key] = newItem
        !useFetch && (axiosCores[key] = axios.create(item));
      }
    })
    SFinfos.baseCfg = baseCfgs['default'];
    !useFetch && (SFinfos.core = axiosCores['default']);
  }
  _fetchSupportCheck (forceAxios) {
    this._fetchEnable = (typeof fetch === 'function');
    !forceAxios && this._ajaxCoreSwitch(!this._fetchEnable);
  }
  _ajaxCoreSwitch (useAxios) {
    Object.assign(SmartFetch.SFinfos, useAxios ? {
      useFetch: false,
      core: axios
    } : {
      useFetch: true,
      core: fetch.bind(window || global)
    })
  }

  // init the core of ajax, set default config

  // for Vue.use method of vuejs 
  install (Vue, options) {
    options && (typeof options === 'object') && this.resetOpts(options);
    Vue.prototype.$fetch = this.vueFetch;
    Vue.mixin({
      data: () => ({ SAKEYS: {} })
    });
  }
  // a special method of fetch for vue
  vueFetch (...args) {
    const config = SmartFetch.fetchArgsSwitch(...args);
    return new SmartApiVue(SmartFetch.SFinfos, this, config);
  }
  fetch (...args) {
    const module = SmartFetch.checkContext(this);
    const config = SmartFetch.fetchArgsSwitch(...args);
    !moduleMap[module] && (window.$SAKEYS = {})
    return moduleMap[module] ? new moduleMap[module](SmartFetch.SFinfos, this, config) : SmartApi(SmartFetch.SFinfos, window);
  }
  // 获取配置信息
  modifyBaseConfigs (handler) {
    if (typeof handler !== 'function') return
    handler(SmartFetch.SFinfos.userConfig.baseConfig)
    SmartFetch.fetchCoreSetup(SmartFetch.SFinfos.userConfig.baseConfig);
  }
  // reset options
  resetOpts (options) {
    let { userConfig, statusMsgs } = SmartFetch.SFinfos;
    Object.assign(userConfig, options);
    options.statusWarn && (typeof options.statusWarn === 'object') && Object.assign(statusMsgs, options.statusWarn);
    options.forceAxios && this._ajaxCoreSwitch(true);
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    options.baseConfig && SmartFetch.fetchCoreSetup(options.baseConfig);
  }

}

const request = SARequest(SmartFetch.SFinfos);

export { request }
 
export default new SmartFetch();


