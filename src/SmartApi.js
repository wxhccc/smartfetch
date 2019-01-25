import AxiosCore from './AxiosCore';

const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
};
const responseMixin = {
  json: 'json',
  text: 'text',
  blob: 'blob',
  arraybuffer: 'arrayBuffer'
}

const { hasOwnProperty } = Object.prototype

class CodeError extends Error {
  constructor (...args) {
    super(...args)
  }
}
class CallbackSyntaxError extends Error {
  constructor (...args) {
    super(...args)
  }
}

export default class SmartApi {
  __response = null;
  _silence = false;
  _needCodeCheck = true;
  _codeCheckResult = false;
  _lockKey = [];
  _useCore = 'default';
  _faileHandle = null;
  _successHandle = null;
  _returnPromise = false;
  _SFinfos = {};
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
    this._reqPromise = Promise.resolve().then(() => {
      if (!this._checkLock()) {
        this._lock();
        return this._request(config).then(this._codeCheck).then(this._handleResData).catch(this._handleError);;
      }
    })
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
      .then(this._resStatusCheck)
      .then(this._typeHandle);
  }
  _handleResData = (resjson) => {
    let data = resjson
    try {
      if (this._needCodeCheck) {
        const dataKey = this.userConfig.dataKey || 'data';
        data = resjson[dataKey]
        this._codeCheckResult && this._successHandle && this._successHandle(data);
      }
      else {
        this._successHandle && this._successHandle(data);
      }
      return data
    } catch (e) {
      throw new CallbackSyntaxError(e)
    }
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
    const { responseType } = this._init;
    const mixFn = responseMixin[responseType];
    if (response[mixFn]) {
      return response[mixFn]();
    }
  }
  _resStatusCheck = (response) => {
    this.__response = response;
    const { validateStatus } = this.baseCfg;
    if (validateStatus ? validateStatus(response.status) : response.ok) {
      return response;
    }
    throw new RangeError(response.status);
  }
  _handleError = (error) => {
    this._unlock();
    try {
      this._faileHandle && this._faileHandle(error);
    } catch (e) {}
    
    if (this._silence) return;
    let msg = '';
    let status = ''
    const { statusMsgs, userConfig: { errorHandle, codeError }, useFetch } = this;
    if ((useFetch && error instanceof TypeError) || error.message === 'Network Error') {
      msg = '服务器未响应';
    } else if (error instanceof SyntaxError) {
      msg = '数据解析失败';
    } else if (error instanceof RangeError || error.response) {
      error.response && (this.__response = error.response)
      const { status } = this.__response
      msg = statusMsgs[status] || '请求失败';
    }
    if (error instanceof CodeError && typeof codeError === 'function') {
      codeError(this.__response.data)
    } else if (error instanceof CallbackSyntaxError) {
      // 回调函数内的语法错误默认静默
    } else if (typeof errorHandle === 'function') {
      errorHandle(msg, error, this.__response);
    } else {
      (typeof alert === 'function') ? alert(msg) : console.log(error);
    }
  }
  _resOkCheck (resjson) {
    let result = false;
    const { resCheck } = this.userConfig;
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
      throw new CodeError('code checked failed')
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
  promise () {
    this._returnPromise = true;
    return this._reqPromise;
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