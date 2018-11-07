import AxiosCore from './AxiosCore';

const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
};
const responseMixin = {
  'json': 'json',
}

const { hasOwnProperty } = Object.prototype

export default class SmartApi {
  _silence = false;
  _needCodeCheck = true;
  _codeCheckResult = false;
  _lockKey = [];
  _useCore='default';
  _faileHandle = null;
  _successHandle = null;
  _SAinfos = {};
  constructor (ajaxCore, context) {
    Object.assign(this, ajaxCore);
    this._ajaxCoreMixin(ajaxCore)
    this._context = context;
    return this;
  }
  _ajaxCoreMixin (ajaxCore) {
    !ajaxCore.useFetch && AxiosCore.call(this);
  }
  _createRequest (config) {
    if(!config || typeof config.url !== 'string') return;
    this._checkRequestCore(config)
    setTimeout(() => {
      if (!this._checkLock()) {
        this._lock();
        this._reqPromise = this._request(config).then(this._codeCheck).then(this._handleResData).catch(this._handleError);;
        this._successHandle && this._reqPromise;
      }
    }, 0);
  }
  _checkRequestCore (config) {
    if (!config.useCore || typeof config.useCore !== 'string') return;
    this.useCore(config.useCore);
    delete config.useCore;
  }
  _request (config) {
    const baseConfig = this.baseCfg || {};
    if (baseConfig.baseURL && config.url.indexOf('http') < 0) {
      config.url = baseConfig.baseURL + config.url
    }
    baseConfig.headers && (config.headers = Object.assign({}, config.headers || {}, baseConfig.headers))
    this._init = Object.assign({}, defOpts, config)
    return this.core(config.url, this._init)
      .then(this._resCheck)
      .then(this._typeHandle);
  }
  _handleResData = (resjson) => {
    if (!this._successHandle) return
    try {
      if (this._needCodeCheck) {
        const dataKey = this.userConfig.dataKey || 'data';
        this._codeCheckResult && this._successHandle(resjson[dataKey]);
      }
      else {
        this._successHandle(resjson);
      }
    } catch (e) {}
  }
  _lock () {
    this._stateLock();
  }
  _unlock () {
    this._stateLock(true);
  }
  _checkLock () {
    return this._lockKey && this._getLockValue();
  }
  _stateLock (unlock) {
    const { _lockKey, _context } = this;
    this._setValue(_context, _lockKey, !unlock)
  }
  _getLockValue () {
    const {_context, _lockKey, _useSAkeys} = this;
    return this._getValue(_useSAkeys ? _context.SAKEYS : _context, _lockKey);
  }
  _getValue (obj, path) {
    let result = false;
    const hasOwnProperty = Object.prototype.hasOwnProperty
    if (obj && typeof obj === 'object' && Array.isArray(path)) {
      let curObj = obj;
      for (let i = 0; i < path.length; i++) {
        const key = path[i]
        if (typeof curObj !== 'object' || !hasOwnProperty.call(curObj, key)) {
          break;
        }
        curObj = curObj[key]
        i === path.length - 1 && (result = typeof curObj === 'boolean' ? curObj : false)
      }
    }
    return result
  }
  _setValue (obj, path, value) {
    let curObj = obj.SAKEYS
    for(let i = 0; i < path.length; i++) {
      const key = path[i]
      !hasOwnProperty.call(curObj, key) && (curObj[key] = i === path.length - 1 ? value : {})
      curObj = curObj[key]
    }
  }


  _typeHandle = (response) => {
    let {responseType} = this._init;
    let mixFn = responseMixin[responseType];
    if (response[mixFn]) {
      return response[mixFn]();
    }
  }
  _resCheck (response) {
    if (response.ok) {
      return response;
    }
    throw new Error(response.status);
  }
  _handleError = (error) => {
    this._unlock();
    this._faileHandle && this._faileHandle(error);
    if (this._silence) return;
    let msg = '';
    const {statusMsgs, userConfig: {errorHandle} } = this;
    switch (error.name) {
      case 'TypeError':
        msg = '服务器未响应';
        break;
      case 'SyntaxError':
        msg = '数据解析失败';
        break;
      case 'Error':
        msg = statusMsgs[error.message] || '请求失败';
        break;
    }
    if (typeof errorHandle === 'function') {
      errorHandle(msg, error);
    } else {
      (typeof alert === 'function') ? alert(msg) : console.log(error);
    }
  }
  _resOkCheck (resjson) {
    let result = false;
    const {resCheck} = this.userConfig;
    let resCheckType = typeof resCheck;
    if (resCheckType === 'function') {
      result = resCheck(resjson);
    } else if (resCheckType === 'string') {
      result = resjson[resCheck];
    }
    this._codeCheckResult = result;
    return result;
  }
  _codeCheck = (resjson) => {
    this._unlock();
    if (this._needCodeCheck && !this._resOkCheck(resjson)) {
      this._faileHandle && this._faileHandle(null, resjson);
      if (this._silence) return;
      let {codeError} = this.userConfig;
      codeError(resjson);
    } else {
      return resjson;
    }
  }
  // public apis
  useCore (corekey) {
    if (corekey && typeof corekey === 'string' && this.baseCfgs[corekey]) {
      this._useCore = corekey;
      this.baseCfg = this.baseCfgs[this._useCore]
      !this.useFetch && (this.core = this.axiosCores[this._useCore]);
    }
    return this;
  }
  lock (key) {
    if (key && typeof key === 'string') {
      this._lockKey = key.split('.');
    }
    return this;
  }
  done (successHandle) {
    typeof successHandle === 'function' && (this._successHandle = successHandle);
    return this;
  }
  faile (faileHandle) {
    typeof faileHandle === 'function' && (this._faileHandle = faileHandle);
    return this;
  }
  silence () {
    this._silence = true;
    return this;
  }
  notCheckCode () {
    this._needCodeCheck = false;
    return this;
  }

}