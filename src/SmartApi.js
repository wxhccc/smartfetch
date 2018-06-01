import AxiosCore from './AxiosCore';
const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
};
const responseMixin = {
  'json': 'json',
}

export default class SmartApi {
  _silence = false;
  _checkCode = true;
  _codeCheckResult = false;
  _lockKey = '';
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
    !ajaxCore.hasFetch && AxiosCore.call(this);
  }
  _createRequest (config) {
    setTimeout(() => {
      if (!this._checkLock()) {
        this._lock();
        this._reqPromise = this._request(config)
          .then(this._codeCheck)
          .catch(this._handleError);
        this._successHandle && this._reqPromise.then(this._handleResData);
      }
    }, 0);
  }
  _request (config) {
    this._init = Object.assign({}, defOpts, config)
    return fetch(config.url, config)
      .then(this._resCheck)
      .then(this._typeHandle);
  }
  _handleResData = (resjson) => {
    if (this._codeCheck) {
      this._codeCheckResult && this._successHandle(resjson.data);
    }
    else {
      this._successHandle(resjson);
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
    if (this._silence) return;
    let {errorHandle} = this.userConfig;
    errorHandle(error);
    this._faileHandle && this._faileHandle(error);
  }
  _responseCheck = (resjson) => {
    let {codeCheck} = this.userConfig;
    if (typeof codeCheck === 'function') {
      return codeCheck(resjson);
    }
    else if(typeof codeCheck === 'string'){
      return resjson[codeCheck];
    }
  }
  _codeCheck = (resjson) => {
    this._unlock();
    if (this._checkCode && (this._codeCheckResult = this._responseCheck(resjson))) {
      return resjson;
    }
    if (this._silence) return;
    let {codeError} = this.userConfig;
    codeError(resjson);
    this._faileHandle && this._faileHandle(null, resjson);
  }
  // public apis
  lock (key) {
    if (key && typeof key === 'string') {
      this._lockKey = key;
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
  notCheckJson () {
    this._checkCode = false;
    return this;
  }

}