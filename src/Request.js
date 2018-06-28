import qs from 'qs';

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

export default function (config = {}) {
  let useCore = 'default';
  function request(url, data, method = 'GET', returnLink = false) {
    method = urlMethod.includes(method) ? method : 'GET';
    const {useFetch, userConfig, baseCfgs} = config;
    const canUseLink = ['GET', 'HEAD'].includes(method);
    const {baseData} = userConfig;
    const trueBaseData = typeof baseData === 'function' ? baseData(useCore) : baseData;
    if (returnLink && canUseLink) {
      const baseCfg = baseCfgs && baseCfgs[useCore] ? baseCfgs[useCore] : null
      return returnRequestLink(baseCfg, url, data, trueBaseData)
    }
    let result = {
      url,
      method: useFetch ? method : method.toLowerCase()
    };
    useCore && (result.useCore = useCore)
    if (!data && !trueBaseData) return result;
    !data && (data = {});
    if (canUseLink) {
      trueBaseData && Object.assign(data, trueBaseData);
      useFetch ? (result.url += qs.stringify(data, { addQueryPrefix: true })) : (result.params = data);
    }
    else {
      let isFormData = data instanceof FormData;
      !isFormData && (result.headers = Object.assign(result.headers || {}, {'Content-Type': 'application/json'}));
      trueBaseData && (isFormData ? appendDataToForm(data, trueBaseData) : Object.assign(data, trueBaseData));
      if (useFetch) {
        result.body = isFormData ? data : JSON.stringify(data);
      } else {
        result.data = data;
      }
    }
    return result;
  }
  return function (...args) {
    useCore = 'default';
    const {axiosCores, baseCfgs} = config;
    const farg = args[0]
    if (typeof farg === 'string') {
      return request(...args)
    } else if(farg && (typeof farg.useCore === 'string') && baseCfgs[farg.useCore]) {
      useCore = farg.useCore
      return request
    } else {
      return () => ({})
    }
    
  }
};
function returnRequestLink (baseCfg, url, data, baseData) {
  baseData && Object.assign(data, baseData);
  const paramsStr = qs.stringify(data, { addQueryPrefix: true })
  if (url.indexOf('http') >= 0) {
    return url + paramsStr;
  }
  const baseURL = baseCfg && baseCfg.baseURL ? baseCfg.baseURL : ''
  return baseURL + url + paramsStr;
}

function appendDataToForm (formdata, data) {
  if (!data || !formdata instanceof FormData) return;
  for(let i in data) {
    !formdata.has(i) && formdata.append(i, data[i])
  }
}
