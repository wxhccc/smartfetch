import { SmartFetch } from './index';
import { FetchOptions, FetchReturn, RequestConfig, SerializableObject } from './types';
export default function smartFetchCore<DataType = SerializableObject>(rootInstance: SmartFetch, context: any, config: RequestConfig, options?: FetchOptions): FetchReturn<DataType>;
