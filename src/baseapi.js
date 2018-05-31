const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
};
export default class SmartApi {
  _silence = false;
  _checkCode = true;
  _lockKey = '';
  _faileHandle = null;
  _successHandle = null;
  constructor (ajaxCore, context) {
    Object.assign(this, ajaxCore);
    this._context = context;
    return this;
  }

  _createRequest (url, data) {
    let init = this._init = Object.assign({}, defOpts, data);
    setTimeout(() => {
      if (!this._checkLock()) {
        this._lock();
        this._request = this.core(url, init)
          .then(this._resCheck)
          .then(this._typeHandle)
          .then(this._codeCheck)
          .catch(this._handleError);
        this._successHandle && this._request.then(this._handleResData);
      }
    }, 0);
  }
  _handleResData = (resjson) => {
    resjson && resjson.success && this._successHandle(resjson.data);
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
    if (this._init.responseType === 'json') {
      return response.json();
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
    let {errorHandle} = this.baseConfig;
    errorHandle(error);
    this._faileHandle && this._faileHandle(error);
  }
  _codeCheck = (resjson) => {
    this._unlock();
    if (this._checkCode && resjson.success) {
      return resjson;
    }
    if (this._silence) return;
    let {codeError} = this.baseConfig;
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