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
  _needCodeCheck = true;
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
    !ajaxCore.useFetch && AxiosCore.call(this);
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
    return this.core(config.url, config)
      .then(this._resCheck)
      .then(this._typeHandle);
  }
  _handleResData = (resjson) => {
    if (this._needCodeCheck) {
      const dataKey = this.userConfig.dataKey || 'data';
      this._codeCheckResult && this._successHandle(resjson[dataKey]);
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
    if (this._needCodeCheck && this._resOkCheck(resjson)) {
      return resjson;
    }
    this._faileHandle && this._faileHandle(null, resjson);
    if (this._silence) return;
    let {codeError} = this.userConfig;
    codeError(resjson);
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
  notCheckCode () {
    this._needCodeCheck = false;
    return this;
  }

}