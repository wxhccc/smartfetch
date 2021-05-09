'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var axios = require('axios');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var _Object$prototype = Object.prototype,
    hasOwnProperty$1 = _Object$prototype.hasOwnProperty,
    toString$1 = _Object$prototype.toString;

var objType$1 = function objType(val) {
  var typeKeys = toString$1.call(val).match(/^\[object (.*)\]$/);
  return typeKeys ? typeKeys[1] : '';
};
/**
 * wrap promise and handle reject or err by return an array like [error, undefined]
 * @param promise promise
 * @returns Promise<[K, undefined] | [null, T]>
 */


function awaitWrapper(_x) {
  return _awaitWrapper.apply(this, arguments);
}

function _awaitWrapper() {
  _awaitWrapper = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(promise) {
    var data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return promise;

          case 3:
            data = _context.sent;
            return _context.abrupt("return", [null, data]);

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            return _context.abrupt("return", [_context.t0, undefined]);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 7]]);
  }));
  return _awaitWrapper.apply(this, arguments);
}

function checkContext(context) {
  if (!context) return 'unknown';

  if (context._isVue || context.$ && context.$.vnode) {
    return 'vue';
  } else if ('setState' in context) {
    return 'react';
  }

  return 'unknown';
}

var emptyPromise = function emptyPromise() {
  var ep = Promise.resolve(undefined);
  return Object.assign(ep, {
    then: function then() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var onfulfilled = args[0]; // if then has be called by Promise.all, let ite pass

      if (args.length === 2 && typeof onfulfilled === 'function') {
        return onfulfilled(undefined);
      }

      return ep;
    },
    "catch": function _catch(onrejected) {
      return ep;
    },
    "finally": function _finally() {
      return ep;
    }
  });
};

var lockCtx = {};

function wrapPromise(promise, wrapOrOptions) {
  var contextType = checkContext(this);
  var isReactiveIns = contextType !== 'unknown';
  var context = isReactiveIns ? this : lockCtx;
  var stateKey = contextType === 'react' ? 'state' : '';
  var contextState = stateKey ? context[stateKey] : context;

  var _ref5 = typeof wrapOrOptions === 'boolean' ? {
    wrap: wrapOrOptions
  } : _objectSpread2({}, wrapOrOptions),
      wrap = _ref5.wrap,
      lock = _ref5.lock,
      syncRefHandle = _ref5.syncRefHandle,
      manualUnlock = _ref5.manualUnlock;

  var lockSwitchHook = undefined;
  var lockRefHandle = undefined;
  var lockKey = [];
  var needLock = false;
  var ignoreLock = false;

  var has = function has(val, key) {
    return !!val && hasOwnProperty$1.call(val, key);
  };

  var isObj = function isObj(obj) {
    return objType$1(obj) === 'Object';
  };

  var getValue = function getValue(obj, path) {
    var result = false;

    if (obj && isObj(obj) && Array.isArray(path) && path.length) {
      var curObj = obj;

      for (var i = 0; i < path.length; i++) {
        var key = path[i];

        if (_typeof(curObj) !== 'object' || !has(curObj, key)) {
          break;
        }

        curObj = curObj[key];
        i === path.length - 1 && (result = typeof curObj === 'boolean' ? curObj : false);
      }
    }

    return result;
  };

  var setValue = function setValue(obj, path, value) {
    // if vue2 and path[0] not defined, do nothing
    if (contextType === 'vue' && context.$set && !has(obj, path[0])) return;
    var _context$$set = context.$set,
        $set = _context$$set === void 0 ? function (o, key, val) {
      o[key] = val;
    } : _context$$set;
    var isStateRect = contextType === 'react';
    var originObj = isStateRect ? _objectSpread2({}, obj) : obj;
    var curObj = originObj;
    var canSet = false;

    for (var i = 0; i < path.length; i++) {
      var key = path[i];
      var keyExist = has(curObj, key);

      if (i === path.length - 1) {
        var isBool = typeof curObj[key] === 'boolean';
        canSet = !keyExist || isBool;
        canSet && $set(curObj, key, value);
      } else {
        !keyExist && $set(curObj, key, {});
        if (!isObj(curObj[key])) break;
        isStateRect && (curObj[key] = _objectSpread2({}, curObj[key]));
        curObj = curObj[key];
      }
    } // trigger setState when run in react class component


    isStateRect && canSet && context.setState(_defineProperty({}, path[0], originObj[path[0]]));
  };

  var stateLock = function stateLock(bool) {
    if (lockKey.length) {
      // if not reactive instance, save lock key as string, no need to structure nested object
      isReactiveIns ? setValue(contextState, lockKey, bool) : lockCtx[lock] = bool;
      return;
    }

    if (lockRefHandle) lockRefHandle[0][lockRefHandle[1]] = bool;
    if (lockSwitchHook) lockSwitchHook(bool);
  };

  var checkLock = function checkLock() {
    // use refHandle if contextState not update sync
    if (lockRefHandle) return lockRefHandle[0][lockRefHandle[1]];
    if (!isReactiveIns && typeof lock === 'string') return contextState[lock];
    return getValue(contextState, lockKey);
  };

  if (lock) {
    var isRefHandle = function isRefHandle(val) {
      return Array.isArray(val) && val.length === 2;
    };

    if (typeof lock === 'string') {
      lockKey = lock.split('.');
    } else if (isRefHandle(lock)) {
      lockRefHandle = lock;
    } else if (typeof lock === 'function') {
      lockSwitchHook = lock;

      if (isRefHandle(syncRefHandle)) {
        lockRefHandle = syncRefHandle;
      }
    }

    needLock = lockKey.length > 0 || !!lockRefHandle || !!lockSwitchHook;
    needLock && (ignoreLock = checkLock());
  }

  var corePromsie; // if promise is a function, here need to call it in promise.then to use locking check to prevent next call

  if (typeof promise === 'function') {
    corePromsie = ignoreLock ? emptyPromise() : wrap ? awaitWrapper(promise()) : promise();
  } else {
    corePromsie = wrap ? awaitWrapper(promise) : promise;
  }

  var unlock = function unlock() {
    return stateLock(false);
  };

  Object.defineProperties(corePromsie, {
    '__lockValue': {
      get: checkLock
    },
    unlock: {
      value: unlock
    }
  });

  if (needLock && !ignoreLock) {
    stateLock(true);
    !manualUnlock && corePromsie["finally"](unlock);
  }

  return corePromsie;
}

var wp = Object.defineProperty(wrapPromise, '_checkLockKey', {
  value: function value(key) {
    return lockCtx[key];
  }
});

const defOpts = {
    credentitals: 'same-origin',
    responseType: 'json'
};
const responseMixin = {
    json: 'json',
    text: 'text',
    blob: 'blob',
    arraybuffer: 'arrayBuffer'
};
function createError(name, error, message) {
    error = error instanceof Error ? error : new Error();
    error.name = name;
    message && (error.message = message);
    return error;
}
function smartFetchCore(rootInstance, context, config, options = {}) {
    const $root = rootInstance;
    let usingCore = rootInstance.$core;
    let useBaseCfg = rootInstance.$curCfg;
    let _response = null;
    let _resJson = null;
    const opts = {
        needCodeCheck: !!rootInstance.options.responseCheck,
        silence: false,
        ...options
    };
    let fetchConfig = {};
    const switchUseCore = (corekey) => {
        if (corekey && typeof corekey === 'string' && $root.baseConfigs[corekey]) {
            useBaseCfg = $root.baseConfigs[corekey];
            !$root.useFetch && (usingCore = $root.getAxiosCore(corekey));
        }
    };
    // axios request
    const axiosRequest = async (config) => {
        const axiosRes = await usingCore(config);
        _response = axiosRes;
        return axiosRes.data;
    };
    // window.fetch request
    const request = async (config) => {
        const { baseURL, headers } = useBaseCfg || {};
        if (!config.url)
            config.url = '';
        if (baseURL && (config.url || '').indexOf('http') < 0) {
            config.url = baseURL + config.url;
        }
        headers && (config.headers = { ...config.headers, ...headers });
        fetchConfig = Object.assign({}, defOpts, config);
        const resStatusCheck = (response) => {
            _response = response;
            const { validateStatus } = $root.options;
            if (validateStatus ? validateStatus(response.status) : response.ok) {
                return response;
            }
            throw new Error(`Request failed with status code ${response.status}`);
        };
        const typeHandle = (response) => {
            const { responseType } = fetchConfig;
            const mixFn = responseMixin[responseType];
            return mixFn && typeof response[mixFn] === 'function'
                ? response[mixFn]()
                : undefined;
        };
        const res = await $root.$core(config.url, fetchConfig);
        return typeHandle(resStatusCheck(res));
    };
    const checkRequestCore = (config) => {
        if (!config.useCore || typeof config.useCore !== 'string')
            return;
        switchUseCore(config.useCore);
        delete config.useCore;
    };
    const resOkCheck = (resjson) => {
        let result = false;
        const { responseCheck } = $root.options;
        if (typeof responseCheck === 'function') {
            result = responseCheck(resjson);
        }
        else if (typeof responseCheck === 'string') {
            result = !!resjson[responseCheck];
        }
        return result;
    };
    const codeCheck = (resjson) => {
        if (opts.needCodeCheck && !resOkCheck(resjson)) {
            _resJson = resjson;
            throw createError('CodeError', undefined, 'code checked failed');
        }
        else {
            return resjson;
        }
    };
    const handleResData = (resjson) => {
        const { dataKey } = $root.options;
        return dataKey ? resjson[dataKey] : resjson;
    };
    const createRequest = (config) => {
        const thenQueue = [];
        const sendFetch = () => {
            checkRequestCore(config);
            const reqPromise = async () => {
                try {
                    if (!config || typeof config.url !== 'string') {
                        throw createError('ConfigError', undefined, 'smartfetch: no valid url');
                    }
                    const resJson = await ($root.useFetch
                        ? request(config)
                        : axiosRequest(config));
                    const data = handleResData(codeCheck(resJson));
                    if (thenQueue.length) {
                        const cusData = await thenQueue.reduce((acc, item) => acc.then(item), Promise.resolve(data));
                        return [null, cusData];
                    }
                    return [null, data];
                }
                catch (e) {
                    return handleError(e);
                }
            };
            return wp.call(context, reqPromise, {
                lock: opts.lock
            });
        };
        // if offer lock through options, will lock promise sync
        const reqCorePromise = options.lock
            ? sendFetch()
            : Promise.resolve().then(sendFetch);
        const proxyPromise = Object.assign(reqCorePromise, {
            done: (onfulfilled) => {
                thenQueue.push(onfulfilled);
                return proxyPromise;
            },
            faile: (handler) => {
                opts.failHandler = handler;
                return reqCorePromise;
            },
            useCore: (corekey) => {
                corekey && switchUseCore(corekey);
                return proxyPromise;
            },
            lock: (keyOrHookOrRef, syncRefHandle) => {
                opts.lock = keyOrHookOrRef;
                syncRefHandle && (opts.syncRefHandle = syncRefHandle);
                return proxyPromise;
            },
            silence: () => {
                opts.silence = true;
                return proxyPromise;
            },
            notCheckCode: () => {
                opts.needCodeCheck = false;
                return proxyPromise;
            }
        });
        return proxyPromise;
    };
    const handleError = (error) => {
        if (typeof opts.failHandler === 'function')
            opts.failHandler(error);
        if (opts.silence)
            return [error, undefined];
        let msg = '';
        const { statusMsgs, options: { errorHandler, codeErrorHandler }, useFetch } = $root;
        if ((useFetch && error instanceof TypeError) ||
            error.message === 'Network Error') {
            msg = '服务器未响应';
        }
        else if (error instanceof SyntaxError) {
            msg = '数据解析失败';
        }
        else if (error instanceof RangeError || error.response) {
            error.response && (_response = error.response);
            const { status } = _response;
            msg = (status && statusMsgs[status]) || '请求失败';
        }
        if (error.name === 'CodeError' && typeof codeErrorHandler === 'function') {
            codeErrorHandler(_resJson);
        }
        else if (typeof errorHandler === 'function') {
            errorHandler(msg, error, _response || undefined);
        }
        else {
            typeof alert === 'function' ? alert(msg) : console.error(error);
        }
        return [error, undefined];
    };
    return createRequest(config);
}

const { hasOwnProperty, toString } = Object.prototype;
const has = (val, key) => hasOwnProperty.call(val, key);
const objType = (val) => {
    const typeKeys = toString.call(val).match(/^\[object (.*)\]$/);
    return typeKeys ? typeKeys[1] : '';
};

const urlMethod = [
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
    'PATCH'
];
const enctypeType = {
    json: 'application/json',
    urlencode: 'application/x-www-form-urlencoded',
    text: 'text/plain'
};
function stringify(params) {
    const parts = [];
    const encode = (val) => encodeURIComponent(val)
        .replace(/%3A/gi, ':')
        .replace(/%24/g, '$')
        .replace(/%2C/gi, ',')
        .replace(/%20/g, '+')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']');
    Object.keys(params).forEach((key) => {
        const val = params[key];
        if (val === null || typeof val === 'undefined')
            return;
        const arrVal = Array.isArray(val) ? val : [val];
        if (Array.isArray(val))
            key = key + '[]';
        arrVal.forEach((v) => {
            if (v instanceof Date) {
                v = v.toISOString();
            }
            else if (objType(v) === 'Object') {
                v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
        });
    });
    return parts.join('&');
}
function buildUrl(url, params) {
    if (!params)
        return url;
    let serializedParams = '';
    if (params instanceof URLSearchParams) {
        serializedParams = params.toString();
    }
    else {
        serializedParams = stringify(params);
    }
    if (serializedParams) {
        const hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
            url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }
    return url;
}
function returnRequestLink(url, data, baseCfg) {
    const paramsUrl = buildUrl(url, data);
    if (url.indexOf('http') >= 0) {
        return paramsUrl;
    }
    const baseURL = baseCfg && baseCfg.baseURL ? baseCfg.baseURL : '';
    return baseURL + paramsUrl;
}
function appendDataToForm(formdata, data) {
    if (!data || !(formdata instanceof FormData))
        return;
    for (const i in data) {
        if (formdata.has(i))
            continue;
        const item = data[i];
        if (['Number', 'String', 'Date'].indexOf(objType(item)) > -1) {
            formdata.append(i, objType(item) === 'Date' ? item.toISOString() : String(item));
        }
        else {
            const stringifyData = stringify(item);
            const slitParams = stringifyData.split('&').map((i) => i.split('='));
            slitParams.forEach(([key, val]) => key && val && formdata.append(key, val));
        }
    }
}
function SFRequest (config) {
    let useCore = 'default';
    const { useFetch, options, baseConfigs } = config;
    /** get request config data */
    function createRequestConfig(url, data = {}, method = 'GET', extra) {
        method = urlMethod.includes(method) ? method : 'GET';
        const isNoBody = ['GET', 'HEAD'].includes(method);
        const { baseData } = options;
        const trueBaseData = typeof baseData === 'function' ? baseData(useCore) : baseData;
        const isFormData = data instanceof FormData;
        const handleData = {
            ...trueBaseData,
            ...(isFormData ? {} : data)
        };
        const { returnLink, enctype } = {
            returnLink: false,
            enctype: 'json',
            ...extra
        };
        // return link url
        if (returnLink && isNoBody) {
            const baseCfg = baseConfigs && baseConfigs[useCore] ? baseConfigs[useCore] : undefined;
            return returnRequestLink(url, handleData, baseCfg);
        }
        const result = {
            url,
            method: (useFetch ? method : method.toLowerCase()),
            useCore
        };
        if (enctype !== 'none')
            result.headers = {
                'Content-Type': (enctypeType[enctype]
                    ? enctypeType[enctype]
                    : enctypeType['json'])
            };
        if (useFetch && enctype !== 'json')
            result.responseType = 'blob';
        if (!Object.keys(handleData).length)
            return result;
        // query methods
        if (isNoBody) {
            useFetch
                ? (result.url += `?${stringify(handleData)}`)
                : (result.params = data);
            return result;
        }
        // request body methods
        // append baseData to formData if data is FormData
        trueBaseData && isFormData && appendDataToForm(data, handleData);
        if (useFetch) {
            result.body = isFormData
                ? data
                : enctype === 'json'
                    ? JSON.stringify(data)
                    : stringify(data);
        }
        else {
            result.data =
                isFormData || enctype === 'json'
                    ? data
                    : stringify(data);
        }
        return result;
    }
    function configGenerate(...args) {
        useCore = 'default';
        const firstArg = args[0];
        if (typeof firstArg === 'string') {
            return createRequestConfig(...args);
        }
        else if (firstArg &&
            typeof firstArg.useCore === 'string' &&
            baseConfigs[firstArg.useCore]) {
            useCore = firstArg.useCore;
            return createRequestConfig;
        }
        else {
            return () => undefined;
        }
    }
    return configGenerate;
}

function fetchContextMethod(instance) {
    const fetch = function (configOrUrl, dataOrOptions, method, options) {
        const config = typeof configOrUrl === 'string'
            ? request(configOrUrl, dataOrOptions, method)
            : configOrUrl || {};
        return smartFetchCore(instance, this, config, options);
    };
    return fetch;
}
class SmartFetch {
    constructor(options) {
        this._fetchEnable = false;
        this._useFetch = true;
        this._axiosCores = Object.create(null);
        this._baseCfgs = Object.create(null);
        this._statusMsgs = Object.create(null);
        this.$curCfg = Object.create(null);
        this._options = {};
        this.fetch = fetchContextMethod(this);
        this.resetOptions(options);
        this._fetchCoreChoose(!!(options && options.forceAxios));
    }
    get useFetch() {
        return this._useFetch;
    }
    get axiosCores() {
        return this._axiosCores;
    }
    get baseConfigs() {
        return this._baseCfgs;
    }
    get statusMsgs() {
        return this._statusMsgs;
    }
    get options() {
        return this._options;
    }
    _fetchCoreChoose(forceAxios) {
        this._fetchEnable = typeof fetch === 'function';
        this._ajaxCoreSwitch(forceAxios || !this._fetchEnable);
    }
    _ajaxCoreSwitch(useAxios) {
        Object.assign(this, {
            _useFetch: !useAxios,
            $core: useAxios ? axios__default['default'] : fetch.bind(window || global)
        });
    }
    _fetchCoreSetup(baseConfigs) {
        const { _axiosCores, _baseCfgs, _useFetch } = this;
        const configs = Array.isArray(baseConfigs)
            ? baseConfigs.length
                ? baseConfigs
                : [{ key: 'default' }]
            : [{ key: 'default', ...baseConfigs }];
        configs.forEach((item) => {
            const newItem = Object.assign({}, item);
            const { key } = newItem;
            if (key) {
                delete newItem.key;
                _baseCfgs[key] = newItem;
                !_useFetch && (_axiosCores[key] = axios__default['default'].create(item));
            }
        });
        this.$curCfg = _baseCfgs['default'];
        !_useFetch && (this.$core = _axiosCores['default']);
    }
    getAxiosCore(key) {
        return has(this._axiosCores, key) ? this._axiosCores[key] : this.$core;
    }
    // init the core of ajax, set default config
    // for Vue.use method of vuejs
    install(appOrVue, options) {
        options && options instanceof Object && this.resetOptions(options);
        if ('globalProperties' in appOrVue.config) {
            appOrVue.config.globalProperties.$fetch = this.fetch;
        }
        else {
            appOrVue.prototype.$fetch = this.fetch;
        }
    }
    // modify base configs
    modifyBaseConfigs(handler) {
        if (typeof handler === 'function')
            handler(this._baseCfgs);
    }
    // reset options
    resetOptions(options = {}, notAssign) {
        if (!options && objType(options) !== 'Object')
            return;
        this._options = notAssign ? options : { ...this._options, ...options };
        this._ajaxCoreSwitch(!!options.forceAxios);
        /* if baseConfig has set and axios will be used , make a instance of axios to be core */
        options.baseConfigs && this._fetchCoreSetup(options.baseConfigs);
    }
}
const rootInstance = new SmartFetch();
const request = SFRequest(rootInstance);

exports.SmartFetch = SmartFetch;
exports.default = rootInstance;
exports.request = request;
exports.wp = wp;
