import { SmartFetch } from './index';
import { FetchOptions, PromiseWithMethods, RequestConfig } from './types';
export default function smartFetchCore<DataType = any>(rootInstance: SmartFetch, context: any, config: RequestConfig, options?: FetchOptions): PromiseWithMethods<DataType | [null, DataType] | [Error, undefined]>;
