import { SmartFetch } from './index';
import { ContextType, PromiseWithMethods, RequestConfig } from './types';
export default function smartFetchCore<DataType = any>(rootInstance: SmartFetch, context: any, config: RequestConfig, contextType: ContextType): PromiseWithMethods<DataType | [null, DataType] | [Error, undefined]>;
