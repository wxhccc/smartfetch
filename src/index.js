import SmartApiVue from './SmartApiVue';
import SmartApiReact from './SmartApiReact';

const moduleMap = {
  'vue': SmartApiVue,
  'react': SmartApiReact
};
class SmartApiErector {
  constructor () {
    this.resetOpts();
    getAjaxCore(this);
    this.init();
  }
  static ajaxCore = {baseConfig: Object.create(null)};
  static checkContext (context) {
    if (context.hasOwnProperty('_isVue')) {
      return 'vue';
    }
    else if (context.hasOwnProperty('state') || context.hasOwnProperty('setState')) {
      return 'react';
    }
  }
  // init the core of ajax, set default config
  init () {
    const {module} = this;
    if (module === 'axios') {

    }
  }
  // for vuejs
  install (Vue, options) {
    this.resetOpts(options);
    Vue.prototype.$fetch = this.vueFetch;
    Vue.mixin({
      data: () => ({SAKEYS: {}})
    });
  }
  vueFetch (url, init) {
    return new SmartApiVue(SmartApiErector.ajaxCore, this, url, init);
  }
  fetch (url, init) {
    let module = SmartApiErector.checkContext(this);
    return moduleMap[module] ? new moduleMap[module](SmartApiErector.ajaxCore, this, url, init) : null;
  }
  resetOpts (options) {
    Object.assign(SmartApiErector.ajaxCore.baseConfig, options);
  }
}
async function getAjaxCore (env) {
  let {ajaxCore} = SmartApiErector;
  ajaxCore.core = null; // fetch;
  ajaxCore.core && (ajaxCore.module = 'fetch');
  if (!ajaxCore.core) {
    //ajaxCore.core = require('axios');
    //console.log(ajaxCore.core)
    ajaxCore.module = 'axios';
  }
}



export default new SmartApiErector();