import axios from 'axios';
import SmartApiVue from './SmartApiVue';
import SmartApiReact from './SmartApiReact';
import SARequest from './Request';

const moduleMap = {
  'vue': SmartApiVue,
  'react': SmartApiReact
};
class SmartApiErector {
  constructor () {
    this._fetchSupportCheck();
  }
  static SAinfos = {
    useFetch: true, 
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
      config = config(args.slice(1));
    }
    return config;
  }
  _fetchSupportCheck () {
    this._fetchEnable = (typeof fetch === 'function');
    this._ajaxCoreSwitch(!this._fetchEnable);
  }
  _ajaxCoreSwitch (useAxios) {
    Object.assign(SmartApiErector.SAinfos, useAxios ? {
      useFetch: false,
      core: axios
    } : {
      useFetch: true,
      core: fetch
    })
  }

  // init the core of ajax, set default config

  // for vuejs
  install (Vue, options) {
    (typeof options === 'object') && this.resetOpts(options);
    Vue.prototype.$fetch = this.vueFetch;
    Vue.mixin({
      data: () => ({SAKEYS: {}})
    });
  }
  vueFetch (...args) {
    let config = SmartApiErector.fetchArgsSwitch(...args);
    return new SmartApiVue(SmartApiErector.SAinfos, this, config);
  }
  fetch (...args) {
    let module = SmartApiErector.checkContext(this);
    let config = SmartApiErector.fetchArgsSwitch(...args);
    return moduleMap[module] ? new moduleMap[module](SmartApiErector.SAinfos, this, config) : null;
  }

  resetOpts (options) {
    let { userConfig, statusMsgs } = SmartApiErector.SAinfos;
    Object.assign(userConfig, options);
    (typeof options.statusWarn === 'object') && Object.assign(statusMsgs, options.statusWarn);
    options.forceAxios && (this._ajaxCoreSwitch(true));
    /* if baseConfig has set and axios will be used , make a instance of axios to be core */
    if (options.baseConfig && !SmartApiErector.SAinfos.useFetch) {
      SmartApiErector.SAinfos.core = axios.create(options.baseConfig);
    }
  }

}

const request = SARequest(SmartApiErector.SAinfos);
export {request};


export default new SmartApiErector();


