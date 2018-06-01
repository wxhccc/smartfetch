import SmartApiVue from './SmartApiVue';
import SmartApiReact from './SmartApiReact';

const moduleMap = {
  'vue': SmartApiVue,
  'react': SmartApiReact
};
class SmartApiErector {
  constructor () {
    this._fetchSupportCheck();
  }
  static SAinfos = {
    hasFetch: true, 
    userConfig: Object.create(null)
  };
  static checkContext (context) {
    if (context.hasOwnProperty('_isVue')) {
      return 'vue';
    }
    else if (context.hasOwnProperty('state') || context.hasOwnProperty('setState')) {
      return 'react';
    }
  }
  static request () {
    console.log(this);
  }
  _fetchSupportCheck () {
    SmartApiErector.SAinfos.hasFetch = (typeof fetch === 'function');
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
  vueFetch (config) {
    return new SmartApiVue(SmartApiErector.SAinfos, this, config);
  }
  fetch (config) {
    let module = SmartApiErector.checkContext(this);
    return moduleMap[module] ? new moduleMap[module](SmartApiErector.SAinfos, this, config) : null;
  }
  resetOpts (options) {
    Object.assign(SmartApiErector.SAinfos.userConfig, options);
  }
}


export default new SmartApiErector();


export function request (url, data, method) {
  let {coreModule} = this;

};
function checkUrl (url) {
  if (url.indexOf('http')) return url;
  let {baseUrl} = SmartApiErector.ajaxCore.baseConfig;
  return baseUrl ? baseUrl + url : url;
}
