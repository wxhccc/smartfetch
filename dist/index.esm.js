import axios from 'axios';
import { stringify } from 'query-string';

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
const { hasOwnProperty: hasOwnProperty$1 } = Object.prototype;
function createError(name, error, message) {
    error = error instanceof Error ? error : new Error();
    error.name = name;
    message && (error.message = message);
    return error;
}
class SmartFetchCore {
    constructor(rootInstance, context, config, contentType) {
        this.__response = null;
        this.__resJson = null;
        this._silence = false;
        this._codeCheckResult = false;
        this._lockKey = [];
        this._useCoreKey = 'default';
        this._contextState = {};
        this._fetchConfig = {};
        this._handleResData = (resjson) => {
            let data = resjson;
            try {
                const { dataKey } = this.$root.options;
                return dataKey ? resjson[dataKey] : data;
            }
            catch (e) {
                throw createError('CallbackSyntaxError', e);
            }
        };
        this._typeHandle = (response) => {
            const { responseType } = this._fetchConfig;
            const mixFn = responseMixin[responseType];
            console.log(111, responseType, mixFn);
            return mixFn && (typeof response[mixFn] === 'function') ? response[mixFn]() : undefined;
        };
        this._resStatusCheck = (response) => {
            this.__response = response;
            const { validateStatus } = this.$root.options;
            if (validateStatus ? validateStatus(response.status) : response.ok) {
                return response;
            }
            throw new RangeError(String(response.status));
        };
        this._handleError = (error) => {
            if (!this._silence) {
                let msg = '';
                const { statusMsgs, options: { errorHandler, codeErrorHandler }, useFetch } = this.$root;
                if ((useFetch && error instanceof TypeError) || error.message === 'Network Error') {
                    msg = '服务器未响应';
                }
                else if (error instanceof SyntaxError) {
                    msg = '数据解析失败';
                }
                else if (error instanceof RangeError || error.response) {
                    error.response && (this.__response = error.response);
                    const { status } = this.__response;
                    msg = (status && statusMsgs[status]) || '请求失败';
                }
                if (error.name === 'CodeError' && typeof codeErrorHandler === 'function') {
                    codeErrorHandler(this.__resJson);
                }
                else if (error.name === 'CallbackSyntaxError') ;
                else if (typeof errorHandler === 'function') {
                    errorHandler(msg, error, this.__response || undefined);
                }
                else {
                    (typeof alert === 'function') ? alert(msg) : console.error(error);
                }
            }
            const hasFail = typeof this._failHandler === 'function';
            if (hasFail)
                return this._failHandler(error);
            if (hasFail)
                return error;
            else
                throw error;
        };
        this._handleFinally = () => {
            this._unlock();
        };
        this._codeCheck = (resjson) => {
            if (this._needCodeCheck && !this._resOkCheck(resjson)) {
                this.__resJson = resjson;
                throw createError('CodeError', undefined, 'code checked failed');
            }
            else {
                return resjson;
            }
        };
        this.$root = rootInstance;
        this._context = context;
        this._useCore = rootInstance.$core;
        this._useBaseCfg = rootInstance.$curCfg;
        this._contentType = contentType;
        this._needCodeCheck = !!rootInstance.options.responseCheck;
        this._isReactiveIns = contentType !== 'default';
        const stateKey = contentType ? (contentType === 'react' ? 'state' : '') : '$_SF_KEYS';
        this._contextState = stateKey ? this._context[stateKey] : this._context;
        this._reqPromise = this._createRequest(config);
    }
    get $promise() { return this._reqPromise; }
    _axiosRequest(config) {
        const axiosInstanc = this.$root.$core;
        return axiosInstanc(config).then(this._axiosResStatusCheck);
    }
    _axiosResStatusCheck(response) {
        this.__response = response;
        return response.data;
    }
    _createRequest(config) {
        if (!config || typeof config.url !== 'string') {
            return Promise.reject(new Error('smartfetch: no valid url'));
        }
        this._checkRequestCore(config);
        const thenQueue = [];
        const reqPromise = Promise.resolve().then(() => {
            if (!this._checkLock()) {
                this._lock();
                const promise = (this.$root.useFetch ? this._request(config) : this._axiosRequest(config))
                    .then(this._codeCheck)
                    .then(this._handleResData);
                const customPro = thenQueue.reduce((acc, item) => acc.then(item), promise);
                return customPro.catch(this._handleError).finally(this._handleFinally);
            }
        });
        const proxyPromise = Object.assign({}, reqPromise, {
            then: (onfulfilled) => {
                thenQueue.push(onfulfilled);
                return proxyPromise;
            },
            catch: (handler) => {
                this._failHandler = handler;
                return reqPromise;
            },
            useCore: this.useCore.bind(this),
            lock: (key) => {
                if (key && typeof key === 'string') {
                    this._lockKey = key.split('.');
                    this._contentType === 'vue' && this._checkOrSetVueSAkeys();
                }
                return proxyPromise;
            },
            silence: () => {
                this._silence = true;
                return proxyPromise;
            },
            notCheckCode: () => {
                this._needCodeCheck = false;
                return proxyPromise;
            }
        });
        return proxyPromise;
    }
    _checkRequestCore(config) {
        if (!config.useCore || typeof config.useCore !== 'string')
            return;
        this.useCore(config.useCore);
        delete config.useCore;
    }
    _request(config) {
        const { baseURL, headers } = this._useBaseCfg || {};
        if (!config.url)
            config.url = '';
        if (baseURL && (config.url || '').indexOf('http') < 0) {
            config.url = baseURL + config.url;
        }
        headers && (config.headers = { ...config.headers, ...headers });
        this._fetchConfig = Object.assign({}, defOpts, config);
        return this.$root.$core(config.url, this._fetchConfig)
            .then(this._resStatusCheck)
            .then(this._typeHandle);
    }
    _lock() {
        this._stateLock();
    }
    _unlock() {
        this._stateLock(true);
    }
    _checkLock() {
        return this._lockKey && this._getLockValue();
    }
    _stateLock(unlock) {
        const { _lockKey, _contextState, _contentType } = this;
        if (!_lockKey.length)
            return;
        this[_contentType === 'vue' ? '_setVueValue' : '_setAsyncValue'](_contextState, _lockKey, !unlock);
    }
    _getLockValue() {
        const { _contextState, _lockKey } = this;
        return this._getValue(_contextState, _lockKey);
    }
    _getValue(obj, path) {
        let result = false;
        if (obj && typeof obj === 'object' && Array.isArray(path)) {
            let curObj = obj;
            for (let i = 0; i < path.length; i++) {
                const key = path[i];
                if (typeof curObj !== 'object' || !hasOwnProperty$1.call(curObj, key)) {
                    break;
                }
                curObj = curObj[key];
                i === path.length - 1 && (result = typeof curObj === 'boolean' ? curObj : false);
            }
        }
        return result;
    }
    _resOkCheck(resjson) {
        let result = false;
        const { responseCheck } = this.$root.options;
        if (typeof responseCheck === 'function') {
            result = responseCheck(resjson);
        }
        else if (typeof responseCheck === 'string') {
            result = !!resjson[responseCheck];
        }
        this._codeCheckResult = result;
        return result;
    }
    _checkOrSetVueSAkeys() {
        const { _context, _lockKey, _isReactiveIns } = this;
        const useSAkeys = !hasOwnProperty$1.call(_context, _lockKey[0]);
        if (_isReactiveIns && useSAkeys) {
            !hasOwnProperty$1.call(_context, 'SF_KEYS') && _context.$set('SF_KEYS', {});
            this._contextState = _context['SF_KEYS'];
        }
    }
    _setVueValue(obj, path, value) {
        const { $set = (o, key, val) => { o[key] = val; } } = this._context;
        let curObj = obj;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            const hasKey = hasOwnProperty$1.call(curObj, key);
            const isObj = hasKey && typeof curObj[key] === 'object' && curObj[key];
            if (i === path.length - 1) {
                hasKey ? (!isObj && (curObj[key] = value)) : $set(curObj, key, value);
            }
            else {
                !hasKey && $set(curObj, key, {});
            }
            curObj = curObj[key];
            if (typeof curObj !== 'object') {
                break;
            }
        }
    }
    _setAsyncValue(obj, path, value) {
        let curObj = obj;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (i === path.length - 1) {
                curObj[key] = value;
            }
            else {
                typeof curObj === 'object' && !hasOwnProperty$1.call(curObj, key) && (curObj[key] = {});
                curObj = curObj[key];
            }
        }
        path.length && this._contentType === 'react' && this._context.setState({ [path[0]]: this._contextState[path[0]] });
    }
    // public apis throght
    useCore(corekey) {
        if (corekey && typeof corekey === 'string' && this.$root.baseConfigs[corekey]) {
            this._useCoreKey = corekey;
            this._useBaseCfg = this.$root.baseConfigs[corekey];
            !this.$root.useFetch && (this._useCore = this.$root.axiosCores[corekey]);
        }
        return this._reqPromise;
    }
}

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
const enctypeType = {
    json: 'application/json',
    urlencode: 'application/x-www-form-urlencoded',
    text: 'text/plain'
};
function returnRequestLink(url, data, baseCfg) {
    const paramsStr = '?' + stringify(data);
    if (url.indexOf('http') >= 0) {
        return url + paramsStr;
    }
    const baseURL = baseCfg && baseCfg.baseURL ? baseCfg.baseURL : '';
    return baseURL + url + paramsStr;
}
function appendDataToForm(formdata, data) {
    if (!data || !(formdata instanceof FormData))
        return;
    for (let i in data) {
        if (formdata.has(i))
            continue;
        const item = data[i];
        if (typeof item === 'number' || typeof item === 'string') {
            formdata.append(i, String(item));
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
    function createRequestConfig(url, data = {}, method = 'GET', returnLink = false, enctype = 'json') {
        method = urlMethod.includes(method) ? method : 'GET';
        const canUseLink = ['GET', 'HEAD'].includes(method);
        const { baseData } = options;
        const trueBaseData = typeof baseData === 'function' ? baseData(useCore) : baseData;
        const isFormData = data instanceof FormData;
        const handleData = { ...trueBaseData, ...(isFormData ? {} : data) };
        // return link
        if (returnLink && canUseLink) {
            const baseCfg = baseConfigs && baseConfigs[useCore] ? baseConfigs[useCore] : undefined;
            return returnRequestLink(url, handleData, baseCfg);
        }
        const result = {
            url,
            method: (useFetch ? method : method.toLowerCase()),
            useCore
        };
        if (!Object.keys(handleData).length)
            return result;
        // query methods
        if (canUseLink) {
            useFetch ? (result.url += `?${stringify(handleData)}`) : (result.params = data);
            return result;
        }
        // request body methods
        trueBaseData && isFormData && appendDataToForm(data, handleData);
        if (useFetch) {
            result.headers = Object.assign(result.headers || {}, { 'Content-Type': enctypeType[enctype] ? enctypeType[enctype] : enctypeType['json'] });
            result.body = isFormData ? data : (enctype === 'json' ? JSON.stringify(data) : stringify(data));
        }
        else {
            result.data = (isFormData || enctype === 'json') ? data : stringify(data);
        }
        return result;
    }
    function configGenerate(...args) {
        useCore = 'default';
        const firstArg = args[0];
        if (typeof firstArg === 'string') {
            return createRequestConfig(...args);
        }
        else if (firstArg && (typeof firstArg.useCore === 'string') && baseConfigs[firstArg.useCore]) {
            useCore = firstArg.useCore;
            return createRequestConfig;
        }
        else {
            return () => undefined;
        }
    }
    return configGenerate;
}

const { hasOwnProperty, toString } = Object.prototype;
const objType = (val) => {
    const typeKeys = toString.call(val).match(/^\[object (.*)\]$/);
    return typeKeys ? typeKeys[1] : '';
};
function checkContext(context) {
    if (context._isVue || (context.$ && context.$.vnode)) {
        return 'vue';
    }
    else if ('setState' in context) {
        return 'react';
    }
    return 'default';
}
// function fetchArgsSwitch (config: RequestConfig): RequestConfig
// function fetchArgsSwitch (...args: Parameters<CreateRequestConfig>): RequestConfig
// function fetchArgsSwitch (requestFn: RequestFn, ...args: Parameters<typeof requestFn>): RequestConfig
function fetchArgsSwitch(...args) {
    const firstArg = args[0];
    if (typeof firstArg === 'string') {
        return request(...args);
    }
    else if (typeof firstArg === 'function') {
        return firstArg(...args.slice(1));
    }
    return {};
}
function fetchContextMethod(instance) {
    return function (...args) {
        const instanceType = checkContext(this);
        const config = args.length ? fetchArgsSwitch(...args) : {};
        const context = instanceType ? this : (self || window || global);
        context && instanceType === 'default' && !hasOwnProperty.call(context, '$_SF_KEYS') && (context.$_SF_KEYS = {});
        return new SmartFetchCore(instance, context, config, instanceType).$promise;
    };
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
        this.resetOpts(options);
        this._fetchCoreChoose(!!(options && options.forceAxios));
    }
    get useFetch() { return this._useFetch; }
    get axiosCores() { return this._axiosCores; }
    get baseConfigs() { return this._baseCfgs; }
    get statusMsgs() { return this._statusMsgs; }
    get options() { return this._options; }
    _fetchCoreChoose(forceAxios) {
        this._fetchEnable = (typeof fetch === 'function');
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
            ? baseConfigs.length ? baseConfigs : [{ key: 'default' }]
            : [{ key: 'default', ...baseConfigs }];
        configs.forEach(item => {
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
        options && (options instanceof Object) && this.resetOpts(options);
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
    resetOpts(options = {}) {
        if (!options && objType(options) !== 'Object')
            return;
        Object.assign(this._options, options);
        this._ajaxCoreSwitch(!!options.forceAxios);
        /* if baseConfig has set and axios will be used , make a instance of axios to be core */
        options.baseConfigs && this._fetchCoreSetup(options.baseConfigs);
    }
}
const rootInstance = new SmartFetch();
const request = SFRequest(rootInstance);

export default rootInstance;
export { SmartFetch, request };
