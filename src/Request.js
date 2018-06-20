import qs from 'qs';

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

export default function (config = {}) {
  return function (url, data, method = 'GET', returnLink = false) {
    method = urlMethod.includes(method) ? method : 'GET';
    const {useFetch, userConfig} = config;
    const {baseData} = userConfig;
    if (returnLink) {
      baseData && Object.assign(data, baseData);
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
    if (!data && !baseData) return result;
    !data && (data = {});
    if (['GET', 'HEAD'].includes(method)) {
      baseData && Object.assign(data, baseData);
      useFetch ? (result.url += qs.stringify(data, { addQueryPrefix: true })) : (result.params = data);
    }
    else {
      let isFormData = data instanceof FormData;
      !isFormData && (result.headers = Object.assign(result.headers || {}, {'Content-Type': 'application/json'}));
      baseData && (isFormData ? appendDataToForm(data, baseData) : Object.assign(data, baseData));
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
