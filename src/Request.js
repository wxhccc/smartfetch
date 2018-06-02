import qs from 'qs';

const urlMethod = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

export default function (config = {}) {
  const {useFetch} = config;
  return function(url, data, method = 'GET') {
    method = urlMethod.includes(method) ? method : 'GET';
    let result = {
      url,
      method
    };
    if (!data) return result;
    if (['GET', 'HEAD'].includes(method)) {
      useFetch ? (result.url += qs.stringify(data, { addQueryPrefix: true })) : (result.params = data);
    }
    else {
      if (useFetch) {
        result.body = data instanceof FormData ? data : JSON.stringify(data);
      } else {
        result.data = data;
      }
    }
    return result;
  }
};

