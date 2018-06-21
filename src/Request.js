import qs from 'qs';

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

export default function (config = {}) {
  return function (url, data, method = 'GET', returnLink = false) {
    method = urlMethod.includes(method) ? method : 'GET';
    const {useFetch, userConfig} = config;
    const {baseData} = userConfig;
    const trueBaseData = typeof baseData === 'function' ? baseData() : baseData;
    if (returnLink) {
      trueBaseData && Object.assign(data, trueBaseData);
      const paramsStr = qs.stringify(data, { addQueryPrefix: true })
      if (url.indexOf('http') >= 0) {
        return url + paramsStr;
      }
      const {baseConfig} = userConfig;
      const baseURL = baseConfig && baseConfig.baseURL ? baseConfig.baseURL : ''
      return baseURL + url + paramsStr;
    }
    let result = {
      url,
      method: useFetch ? method : method.toLowerCase()
    };
    if (!data && !trueBaseData) return result;
    !data && (data = {});
    if (['GET', 'HEAD'].includes(method)) {
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
};

function appendDataToForm (formdata, data) {
  if (!data || !formdata instanceof FormData) return;
  for(let i in data) {
    !formdata.has(i) && formdata.append(data[i])
  }
}
