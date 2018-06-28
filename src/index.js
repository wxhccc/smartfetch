import axios from 'axios';
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
    this._fetchSupportCheck();
    options && (typeof options === 'object') && this.resetOpts(options);
  }
  static SAinfos = {
    useFetch: true,
    axiosCores: Object.create(null),
    baseCfgs: Object.create(null),
    userConfig: Object.create(null),
    statusMsgs: {
      '404': '请求地址不存在',
      '500': '服务器维护中，请稍后再试'
    }
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
    const {SAinfos, SAinfos: {axiosCores, baseCfgs, useFetch}} = this;
    const baseConfig = Array.isArray(baseConfigs) ? baseConfigs : [{key: 'default', ...baseConfigs}];
    baseConfig.forEach(item => {
      const {key} = item;
      if (key) {
        delete item.key;
        baseCfgs[key] = item
        !useFetch && (axiosCores[key] = axios.create(item));
      }
    })
    SAinfos.baseCfg = baseCfgs['default'];
    !useFetch && (SAinfos.core = axiosCores['default']);
  }
  _fetchSupportCheck () {
    this._fetchEnable = (typeof fetch === 'function');
    this._ajaxCoreSwitch(!this._fetchEnable);
  }
  _ajaxCoreSwitch (useAxios) {
    Object.assign(SmartFetch.SAinfos, useAxios ? {
      useFetch: false,
      core: axios
    } : {
      useFetch: true,
      core: fetch.bind(window)
    })
  }

  // init the core of ajax, set default config

  // for Vue.use method of vuejs 
  install (Vue, options) {
    options && (typeof options === 'object') && this.resetOpts(options);
    Vue.prototype.$fetch = this.vueFetch;
    Vue.mixin({
      data: () => ({SAKEYS: {}})
    });
  }
  // a special method of fetch for vue
  vueFetch (...args) {
    let config = SmartFetch.fetchArgsSwitch(...args);
    return new SmartApiVue(SmartFetch.SAinfos, this, config);
  }
  fetch (...args) {
    let module = SmartFetch.checkContext(this);
    let config = SmartFetch.fetchArgsSwitch(...args);
    return moduleMap[module] ? new moduleMap[module](SmartFetch.SAinfos, this, config) : null;
  }
  // reset options
  resetOpts (options) {
    let { userConfig, statusMsgs } = SmartFetch.SAinfos;
    Object.assign(userConfig, options);
    options.statusWarn && (typeof options.statusWarn === 'object') && Object.assign(statusMsgs, options.statusWarn);
    options.forceAxios && this._ajaxCoreSwitch(true);
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    options.baseConfig && SmartFetch.fetchCoreSetup(options.baseConfig);
  }

}

const request = SARequest(SmartFetch.SAinfos);

export {request}
 
export default new SmartFetch();


