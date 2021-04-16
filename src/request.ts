import { Method } from 'axios';
import { stringify } from 'query-string';
import { BaseConfig, RequestConfig, RequestData, SerializableObject, SfRequestConfig } from './types';

const urlMethod: Method[] = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

type EnctypeType = 'json' | 'urlencode' | 'text'

const enctypeType: Record<EnctypeType, string> = {
  json: 'application/json',
  urlencode: 'application/x-www-form-urlencoded',
  text: 'text/plain'
}

function returnRequestLink (url: string, data: Record<string, any>, baseCfg?: BaseConfig) {
  const paramsStr = '?' + stringify(data)
  if (url.indexOf('http') >= 0) {
    return url + paramsStr;
  }
  const baseURL = baseCfg && baseCfg.baseURL ? baseCfg.baseURL : ''
  return baseURL + url + paramsStr;
}

function appendDataToForm (formdata: FormData, data: SerializableObject) {
  if (!data || !(formdata instanceof FormData)) return;
  for(let i in data) {
    if (formdata.has(i)) continue
    const item = data[i]
    if (typeof item === 'number' ||  typeof item === 'string') {
      formdata.append(i, String(item))
    } else {
      const stringifyData = stringify(item)
      const slitParams = stringifyData.split('&').map((i) => i.split('='))
      slitParams.forEach(([key, val]) => key && val && formdata.append(key, val))
    }
  }
}

export interface CreateRequestConfig {
  (url: string, data?: RequestData, method?: Method, returnLink?: boolean, enctype?: EnctypeType): string | RequestConfig<string>
}

export default function (config: SfRequestConfig) {
  let useCore = 'default';
  const { useFetch, options, baseConfigs } = config;
  /** get request config data */
  function createRequestConfig(url: string, data: RequestData = {}, method: Method = 'GET', returnLink = false, enctype: EnctypeType = 'json') {
    method = urlMethod.includes(method) ? method : 'GET';
    const canUseLink = ['GET', 'HEAD'].includes(method);
    const { baseData } = options;
    const trueBaseData = typeof baseData === 'function' ? baseData(useCore) : baseData;
    const isFormData = data instanceof FormData;
    const handleData = { ...trueBaseData, ...(isFormData ? {} : (data as SerializableObject)) };
    // return link
    if (returnLink && canUseLink) {
      const baseCfg = baseConfigs && baseConfigs[useCore] ? baseConfigs[useCore] : undefined
      return returnRequestLink(url, handleData, baseCfg)
    }
    const result: RequestConfig<keyof typeof baseConfigs> = {
      url,
      method: (useFetch ? method : method.toLowerCase()) as Method,
      useCore
    };
    if (!Object.keys(handleData).length) return result;
    // query methods
    if (canUseLink) {
      useFetch ? (result.url += `?${stringify(handleData)}`) : (result.params = data);
      return result;
    }
    // request body methods
    trueBaseData && isFormData && appendDataToForm(data as FormData, handleData)
    if (useFetch) {
      result.headers = Object.assign(result.headers || {}, {'Content-Type': enctypeType[enctype] ? enctypeType[enctype] : enctypeType['json'] })
      result.body = isFormData ? data as FormData : (enctype === 'json' ? JSON.stringify(data) : stringify(data));
    } else {
      result.data = (isFormData || enctype === 'json') ? data : stringify(data);
    }
    return result;
  }


  type HocConfig = {
    useCore: keyof typeof baseConfigs
  }
  type CRCFunction = typeof createRequestConfig

  function configGenerate (...args: Parameters<CRCFunction>): ReturnType<CRCFunction>
  function configGenerate(config: HocConfig): CRCFunction
  function configGenerate (...args: [HocConfig] | Parameters<CRCFunction>) {
    useCore = 'default';
    const firstArg = args[0]
    if (typeof firstArg === 'string') {
      return createRequestConfig(...args as Parameters<CRCFunction>)
    } else if(firstArg && (typeof firstArg.useCore === 'string') && baseConfigs[firstArg.useCore]) {
      useCore = firstArg.useCore
      return createRequestConfig
    } else {
      return () => undefined
    }
    
  }

  return configGenerate
  
};