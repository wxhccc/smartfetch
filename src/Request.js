import qs from 'qs';

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

export default function (config = {}) {
  const {useFetch, userConfig} = config;
  return function (url, data, method = 'GET', returnLink = false) {
    method = urlMethod.includes(method) ? method : 'GET';
    if (returnLink) {
      const paramsStr = qs.stringify(data, { addQueryPrefix: true })
      if (url.indexOf('http') >= 0) {
        return url + paramsStr;
      }
      const {baseConfig: {baseUrl}} = userConfig;
      return baseUrl + url + paramsStr;
    }
    let result = {
      url,
      method
    };
    if (!data) return result;
    if (['GET', 'HEAD'].includes(method)) {
      useFetch ? (result.url += qs.stringify(data, { addQueryPrefix: true })) : (result.params = data);
    }
    else {
      let isFormData = data instanceof FormData;
      !isFormData && (result.headers = Object.assign(result.headers || {}, {'Content-Type': 'application/json'}));
      if (useFetch) {
        result.body = isFormData ? data : JSON.stringify(data);
      } else {
        result.data = data;
      }
    }
    return result;
  }
};

