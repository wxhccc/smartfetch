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

function createError(name, error, message) {
  error = error instanceof Error ? error : new Error()
  error.name = name
  message && (error.message = message)
  return error
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
  _finallyHandle = null;
  _returnPromise = false;
  _SFinfos = {};
  constructor (ajaxCore, context, config, instanceType) {
    Object.assign(this, ajaxCore);
    this._ajaxCoreMixin(ajaxCore)
    this._context = context;
    this._instanceType = instanceType;
    this._isInstance = Boolean(instanceType)
    const stateKey = instanceType ? (instanceType === 'react' ? 'state' : '') : '$_SF_KEYS';
    this._contextState = stateKey ? this._context[stateKey] : this._context;
    this._createRequest(config);
    return this;
  }
  _ajaxCoreMixin (ajaxCore) {
    !ajaxCore.useFetch && AxiosCore.call(this);
  }
  _createRequest (config) {
    if(!config || typeof config.url !== 'string') {
      return console.error('smartfetch: no valid url');
    }
    this._checkRequestCore(config)
    this._reqPromise = Promise.resolve().then(() => {
      if (!this._checkLock()) {
        this._lock();
        return this._request(config).then(this._codeCheck).then(this._handleResData).catch(this._handleError).finally(this._handleFinally);
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
      throw createError('CallbackSyntaxError', e)
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
    const { _lockKey, _contextState } = this;
    _lockKey && this._setValue(_contextState, _lockKey, !unlock)
  }
  _getLockValue () {
    const { _contextState, _lockKey } = this;
    return this._getValue(_contextState, _lockKey);
  }
  _getValue (obj, path) {
    let result = false;
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
    let curObj = obj
    for(let i = 0; i < path.length; i++) {
      const key = path[i]
      if (i === path.length - 1) {
        curObj[key] = value
      } else {
        typeof curObj === 'object' && !hasOwnProperty.call(curObj, key) && (curObj[key] = {})
        curObj = curObj[key]
      }
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
    if (error.name === 'CodeError' && typeof codeError === 'function') {
      codeError(this.__response.data)
    } else if (error.name === 'CallbackSyntaxError') {
      // 回调函数内的语法错误默认静默
    } else if (typeof errorHandle === 'function') {
      errorHandle(msg, error, this.__response);
    } else {
      (typeof alert === 'function') ? alert(msg) : console.error(error);
    }
  }
  _handleFinally = () => {
    this._unlock();
    try {
      this._finallyHandle && this._finallyHandle()
    } catch (e) {}
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
    if (this._needCodeCheck && !this._resOkCheck(resjson)) {
      throw createError('CodeError', null, 'code checked failed')
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
      this._checkOrSetVueSAkeys && this._checkOrSetVueSAkeys()
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
  fail (faileHandle) {
    return this.faile(faileHandle)
  }
  faile (faileHandle) {
    typeof faileHandle === 'function' && (this._faileHandle = faileHandle);
    return this;
  }
  finally (finallyHandle) {
    typeof finallyHandle === 'function' && (this._finallyHandle = finallyHandle);
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