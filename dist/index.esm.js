import axios from 'axios';

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
const { hasOwnProperty: hasOwnProperty$1, toString: toString$1 } = Object.prototype;
const isObj = (obj) => toString$1.call(obj) === '[object Object]';
function createError(name, error, message) {
    error = error instanceof Error ? error : new Error();
    error.name = name;
    message && (error.message = message);
    return error;
}
function smartFetchCore(rootInstance, context, config, contextType) {
    const $root = rootInstance;
    const isReactiveIns = contextType !== 'unknown';
    rootInstance.$core;
    let useBaseCfg = rootInstance.$curCfg;
    let _response = null;
    let _resJson = null;
    let needCodeCheck = !!rootInstance.options.responseCheck;
    const stateKey = isReactiveIns
        ? contextType === 'react'
            ? 'state'
            : ''
        : '$_SF_KEYS';
    const contextState = stateKey ? context[stateKey] : context;
    let fetchConfig = {};
    let silence = false;
    let lockSwitchHook;
    let lockRefHandle;
    let lockKey = [];
    let failHandler;
    const axiosRequest = (config) => {
        const axiosInstanc = $root.$core;
        return axiosInstanc(config).then(axiosResStatusCheck);
    };
    const axiosResStatusCheck = (response) => {
        _response = response;
        return response.data;
    };
    const switchUseCore = (corekey) => {
        if (corekey && typeof corekey === 'string' && $root.baseConfigs[corekey]) {
            useBaseCfg = $root.baseConfigs[corekey];
            !$root.useFetch && ($root.axiosCores[corekey]);
        }
    };
    const createRequest = (config) => {
        let reqPromise;
        const thenQueue = [];
        if (!config || typeof config.url !== 'string') {
            reqPromise = Promise.reject(new Error('smartfetch: no valid url')).catch(handleError);
        }
        else {
            checkRequestCore(config);
            reqPromise = Promise.resolve().then(() => {
                if (!checkLock()) {
                    stateLock(true);
                    const promise = ($root.useFetch
                        ? request(config)
                        : axiosRequest(config))
                        .then(codeCheck)
                        .then(handleResData);
                    const customPro = thenQueue.length
                        ? thenQueue.reduce((acc, item) => acc.then(item), promise)
                        : promise.then((data) => [null, data]);
                    return customPro.catch(handleError).finally(() => stateLock(false));
                }
            });
        }
        const proxyPromise = Object.assign(reqPromise, {
            done: (onfulfilled) => {
                thenQueue.push(onfulfilled);
                return proxyPromise;
            },
            faile: (handler) => {
                failHandler = handler;
                return reqPromise;
            },
            useCore: (corekey) => {
                corekey && switchUseCore(corekey);
                return proxyPromise;
            },
            lock: (keyOrHookOrHandle, syncRefHandle) => {
                const isRefHandle = (val) => Array.isArray(val) && val.length === 2;
                if (typeof keyOrHookOrHandle === 'string') {
                    lockKey = keyOrHookOrHandle.split('.');
                }
                else if (isRefHandle(keyOrHookOrHandle)) {
                    lockRefHandle = keyOrHookOrHandle;
                }
                else if (typeof keyOrHookOrHandle === 'function') {
                    lockSwitchHook = keyOrHookOrHandle;
                    if (isRefHandle(syncRefHandle)) {
                        lockRefHandle = syncRefHandle;
                    }
                }
                return proxyPromise;
            },
            silence: () => {
                silence = true;
                return proxyPromise;
            },
            notCheckCode: () => {
                needCodeCheck = false;
                return proxyPromise;
            }
        });
        return proxyPromise;
    };
    const checkRequestCore = (config) => {
        if (!config.useCore || typeof config.useCore !== 'string')
            return;
        switchUseCore(config.useCore);
        delete config.useCore;
    };
    const request = (config) => {
        const { baseURL, headers } = useBaseCfg || {};
        if (!config.url)
            config.url = '';
        if (baseURL && (config.url || '').indexOf('http') < 0) {
            config.url = baseURL + config.url;
        }
        headers && (config.headers = { ...config.headers, ...headers });
        fetchConfig = Object.assign({}, defOpts, config);
        return $root.$core(config.url, fetchConfig)
            .then(resStatusCheck)
            .then(typeHandle);
    };
    const handleResData = (resjson) => {
        const { dataKey } = $root.options;
        return dataKey ? resjson[dataKey] : resjson;
    };
    const checkLock = () => {
        return lockKey.length > 0 && getValue(contextState, lockKey);
    };
    const stateLock = (bool) => {
        if (lockKey.length)
            return setValue(contextState, lockKey, bool);
        if (lockRefHandle)
            lockRefHandle[0][lockRefHandle[1]] = bool;
        if (lockSwitchHook)
            lockSwitchHook(bool);
    };
    const getValue = (obj, path) => {
        // use refHandle if contextState not update sync
        if (lockRefHandle)
            return lockRefHandle[0][lockRefHandle[1]];
        let result = false;
        if (obj && isObj(obj) && Array.isArray(path)) {
            let curObj = obj;
            for (let i = 0; i < path.length; i++) {
                const key = path[i];
                if (typeof curObj !== 'object' || !hasOwnProperty$1.call(curObj, key)) {
                    break;
                }
                curObj = curObj[key];
                i === path.length - 1 &&
                    (result = typeof curObj === 'boolean' ? curObj : false);
            }
        }
        return result;
    };
    const typeHandle = (response) => {
        const { responseType } = fetchConfig;
        const mixFn = responseMixin[responseType];
        return mixFn && typeof response[mixFn] === 'function'
            ? response[mixFn]()
            : undefined;
    };
    const resStatusCheck = (response) => {
        _response = response;
        const { validateStatus } = $root.options;
        if (validateStatus ? validateStatus(response.status) : response.ok) {
            return response;
        }
        throw new Error(`Request failed with status code ${response.status}`);
    };
    const handleError = (error) => {
        if (typeof failHandler === 'function')
            failHandler(error);
        if (silence)
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
        if (needCodeCheck && !resOkCheck(resjson)) {
            _resJson = resjson;
            throw createError('CodeError', undefined, 'code checked failed');
        }
        else {
            return resjson;
        }
    };
    const setValue = (obj, path, value) => {
        // if vue2 and path[0] not defined, do nothing
        if (contextType === 'vue' &&
            context.$set &&
            !hasOwnProperty$1.call(obj, path[0]))
            return;
        const { $set = (o, key, val) => {
            o[key] = val;
        } } = context;
        const isStateRect = contextType === 'react';
        const originObj = isStateRect ? { ...obj } : obj;
        let curObj = originObj;
        let canSet = false;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            const keyExist = hasOwnProperty$1.call(curObj, key);
            if (i === path.length - 1) {
                const isBool = typeof curObj[key] === 'boolean';
                canSet = !keyExist || isBool;
                canSet && $set(curObj, key, value);
            }
            else {
                !keyExist && $set(curObj, key, {});
                if (!isObj(curObj[key]))
                    break;
                isStateRect && (curObj[key] = { ...curObj[key] });
                curObj = curObj[key];
            }
        }
        // trigger setState when run in react class component
        isStateRect && canSet && context.setState({ [path[0]]: originObj[path[0]] });
    };
    const reqPromise = createRequest(config);
    return reqPromise;
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

function checkContext(context) {
    if (!context)
        return 'unknown';
    if (context._isVue || (context.$ && context.$.vnode)) {
        return 'vue';
    }
    else if ('setState' in context) {
        return 'react';
    }
    return 'unknown';
}
function fetchContextMethod(instance) {
    const fetch = function (configOrUrl, data, method) {
        const instanceType = checkContext(this);
        const config = typeof configOrUrl === 'string'
            ? request(configOrUrl, data, method)
            : configOrUrl || {};
        const context = instanceType !== 'unknown' ? this : self || window || global;
        context &&
            instanceType === 'unknown' &&
            !has(context, '$_SF_KEYS') &&
            (context.$_SF_KEYS = {});
        return smartFetchCore(instance, context, config, instanceType);
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
            $core: useAxios ? axios : fetch.bind(window || global)
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
                !_useFetch && (_axiosCores[key] = axios.create(item));
            }
        });
        this.$curCfg = _baseCfgs['default'];
        !_useFetch && (this.$core = _axiosCores['default']);
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

export default rootInstance;
export { SmartFetch, request };
