import { AxiosError, AxiosInstance, AxiosResponse, ResponseType } from 'axios';
import { SmartFetch } from 'src';
import { BaseConfig, ContentType, FetchCore, FetchResponse, PromiseWithMethods, RequestConfig, SerializableObject, WinFetch } from './types';

const defOpts = {
  credentitals: 'same-origin',
  responseType: 'json'
};

type ResponseBodyMixin = 'json' | 'text' | 'blob' | 'arrayBuffer'
const responseMixin: Partial<Record<ResponseType, ResponseBodyMixin>> = {
  json: 'json',
  text: 'text',
  blob: 'blob',
  arraybuffer: 'arrayBuffer'
}

const { hasOwnProperty } = Object.prototype

function createError(name: string, error?: Error, message?: string) {
  error = error instanceof Error ? error : new Error()
  error.name = name
  message && (error.message = message)
  return error
}

type FaileHandle  = (e: Error) => unknown

export default class SmartFetchCore {
  private $root: SmartFetch;
  private _context;
  private _contentType: ContentType;
  private _isReactiveIns: boolean;
  private __response: FetchResponse | null = null;
  private __resJson: SerializableObject | null = null;
  private _silence = false;
  private _needCodeCheck: boolean;
  private _codeCheckResult = false;
  private _lockKey: string[] = [];
  private _useCoreKey = 'default';
  private _useCore: FetchCore;
  private _useBaseCfg: BaseConfig;
  private _contextState: any = {};
  private _fetchConfig: RequestConfig = {};
  private _reqPromise: PromiseWithMethods<any>;
  private _failHandler?: FaileHandle;
  get $promise () { return this._reqPromise }

  constructor (rootInstance: SmartFetch, context: any, config: RequestConfig, contentType: ContentType) {
    this.$root = rootInstance
    this._context = context;
    this._useCore = rootInstance.$core
    this._useBaseCfg = rootInstance.$curCfg
    this._contentType = contentType;
    this._needCodeCheck = !!rootInstance.options.responseCheck
    this._isReactiveIns = contentType !== 'default';
    const stateKey = contentType ? (contentType === 'react' ? 'state' : '') : '$_SF_KEYS';
    this._contextState = stateKey ? this._context[stateKey] : this._context;
    this._reqPromise = this._createRequest(config);
  }

  private _axiosRequest (config: RequestConfig) {
    const axiosInstanc = this.$root.$core as AxiosInstance
    return axiosInstanc(config).then(this._axiosResStatusCheck);
  }
  private _axiosResStatusCheck (response: AxiosResponse) {
    this.__response = response
    return response.data;
  }

  

  private _createRequest (config: RequestConfig) {
    if(!config || typeof config.url !== 'string') {
      return Promise.reject(new Error('smartfetch: no valid url'))
    }
    this._checkRequestCore(config)
    const thenQueue: any[]= []
    const customeCatch = () => undefined
    const reqPromise = Promise.resolve().then(() => {
      if (!this._checkLock()) {
        this._lock();
        const promise = (this.$root.useFetch ? this._request(config) : this._axiosRequest(config))
          .then(this._codeCheck)
          .then(this._handleResData)
        const customPro = thenQueue.reduce((acc, item) => acc.then(item), promise)
        return customPro.catch(this._handleError).finally(this._handleFinally);
      }
    })
    const proxyPromise = Object.assign({}, reqPromise, {
      then: <T>(onfulfilled?: ((value: any) => T | PromiseLike<T>) | null | undefined) => {
        thenQueue.push(onfulfilled)
        return proxyPromise
      },
      catch: (handler: FaileHandle) => {
        this._failHandler = handler
        return reqPromise
      },
      useCore: this.useCore.bind(this),
      lock: (key: string) => {
        if (key && typeof key === 'string') {
          this._lockKey = key.split('.');
          this._contentType === 'vue' && this._checkOrSetVueSAkeys()
        }
        return proxyPromise;
      },
      silence: () => {
        this._silence = true;
        return proxyPromise;
      },
      notCheckCode: () => {
        this._needCodeCheck = false;
        return proxyPromise
      }
    })
    return proxyPromise as PromiseWithMethods<any>
  }
  private _checkRequestCore (config: RequestConfig) {
    if (!config.useCore || typeof config.useCore !== 'string') return;
    this.useCore(config.useCore);
    delete config.useCore;
  }
  private _request (config: RequestConfig) {
    const { baseURL, headers } = this._useBaseCfg || {};
    if (!config.url) config.url = ''
    if (baseURL && (config.url || '').indexOf('http') < 0) {
      config.url = baseURL + config.url
    }
    headers && (config.headers = { ...config.headers, ...headers })
    this._fetchConfig = Object.assign({}, defOpts, config)
    return (this.$root.$core as WinFetch)(config.url, this._fetchConfig)
      .then(this._resStatusCheck)
      .then(this._typeHandle);
  }
  private _handleResData = (resjson: Record<string, SerializableObject>) => {
    let data: Record<string, SerializableObject> | SerializableObject = resjson
    try {
      const { dataKey } = this.$root.options;
      return dataKey ? resjson[dataKey] : data
    } catch (e) {
      throw createError('CallbackSyntaxError', e)
    }
  }
  private _lock () {
    this._stateLock();
  }
  private _unlock () {
    this._stateLock(true);
  }
  private _checkLock () {
    return this._lockKey && this._getLockValue();
  }
  private _stateLock (unlock?: boolean) {
    const { _lockKey, _contextState, _contentType } = this;
    if (!_lockKey.length) return
    this[_contentType === 'vue' ? '_setVueValue' : '_setAsyncValue'](_contextState, _lockKey, !unlock)
  }
  private _getLockValue () {
    const { _contextState, _lockKey } = this;
    return this._getValue(_contextState, _lockKey);
  }

  private _getValue (obj: any, path: string[]) {
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

  private _typeHandle = (response: Response) => {
    const { responseType } = this._fetchConfig;
    const mixFn = responseMixin[responseType as ResponseType];
    console.log(111, responseType, mixFn)
    return mixFn && (typeof response[mixFn] === 'function') ? response[mixFn]() : undefined;
  }

  private _resStatusCheck = (response: Response) => {
    this.__response = response;
    const { validateStatus } = this.$root.options;
    if (validateStatus ? validateStatus(response.status) : response.ok) {
      return response;
    }
    throw new RangeError(String(response.status));
  }

  private _handleError = (error: Error & AxiosError) => {
    if (!this._silence) {
      let msg = '';
      const { statusMsgs, options: { errorHandler, codeErrorHandler }, useFetch } = this.$root;
      if ((useFetch && error instanceof TypeError) || error.message === 'Network Error') {
        msg = '服务器未响应';
      } else if (error instanceof SyntaxError) {
        msg = '数据解析失败';
      } else if (error instanceof RangeError || error.response) {
        error.response && (this.__response = error.response);
        const { status } = this.__response as Response;
        msg = (status && statusMsgs[status]) || '请求失败';
      }
      if (error.name === 'CodeError' && typeof codeErrorHandler === 'function') {
        codeErrorHandler(this.__resJson as SerializableObject)
      } else if (error.name === 'CallbackSyntaxError') {
        // 回调函数内的语法错误默认静默
      } else if (typeof errorHandler === 'function') {
        errorHandler(msg, error, this.__response || undefined);
      } else {
        (typeof alert === 'function') ? alert(msg) : console.error(error);
      }
    }
    const hasFail = typeof this._failHandler === 'function'
    if (hasFail) return (this._failHandler as FaileHandle)(error)
    if (hasFail) return error
    else throw error;
  }
  private _handleFinally = () => {
    this._unlock();
  }

  private _resOkCheck (resjson: Record<string, SerializableObject>) {
    let result = false;
    const { responseCheck } = this.$root.options;
    if (typeof responseCheck === 'function') {
      result = responseCheck(resjson);
    } else if (typeof responseCheck === 'string') {
      result = !!resjson[responseCheck];
    }
    this._codeCheckResult = result;
    return result;
  }
  private _codeCheck = (resjson: Record<string, SerializableObject>) => {
    if (this._needCodeCheck && !this._resOkCheck(resjson)) {
      this.__resJson = resjson
      throw createError('CodeError', undefined, 'code checked failed')
    } else {
      return resjson;
    }
  }
  private _checkOrSetVueSAkeys () {
    const { _context, _lockKey, _isReactiveIns } = this;
    const useSAkeys = !hasOwnProperty.call(_context, _lockKey[0]);
    if (_isReactiveIns && useSAkeys) {
      !hasOwnProperty.call(_context, 'SF_KEYS') && _context.$set('SF_KEYS', {})
      this._contextState = _context['SF_KEYS']
    }
  }
  private _setVueValue (obj: any, path: string[], value: boolean) {
    const { $set = (o: any, key: string, val: unknown) => { o[key] = val } } = this._context;
    let curObj = obj;
    for(let i = 0; i < path.length; i++) {
      const key = path[i];
      const hasKey = hasOwnProperty.call(curObj, key)
      const isObj = hasKey && typeof curObj[key] === 'object' && curObj[key]
      if (i === path.length - 1) {
        hasKey ? (!isObj && (curObj[key] = value)) : $set(curObj, key, value)
      } else {
        !hasKey && $set(curObj, key, {})
      }
      curObj = curObj[key]
      if (typeof curObj !== 'object') {
        break;
      }
    }
  }
  private _setAsyncValue (obj: any, path: string[], value: boolean) {
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
    path.length && this._contentType === 'react' && this._context.setState({ [path[0]]: this._contextState[path[0]] })
  }

  // public apis throght
  private useCore (corekey: string) {
    if (corekey && typeof corekey === 'string' && this.$root.baseConfigs[corekey]) {
      this._useCoreKey = corekey;
      this._useBaseCfg = this.$root.baseConfigs[corekey]
      !this.$root.useFetch && (this._useCore = this.$root.axiosCores[corekey]);
    }
    return this._reqPromise;
  }

}