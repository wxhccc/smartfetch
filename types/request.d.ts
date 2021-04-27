import { Method } from 'axios';
import { RequestConfig, RequestData, SfRequestConfig } from './types';
declare type EnctypeType = 'json' | 'urlencode' | 'text' | 'none';
export interface RequestExtraArgs {
    returnLink?: boolean;
    enctype?: EnctypeType;
}
export interface CreateRequestConfig {
    (url: string, data?: RequestData, method?: Method, extra?: RequestExtraArgs): string | RequestConfig<string>;
}
export default function (config: SfRequestConfig): {
    (url: string, data?: RequestData | undefined, method?: Method | undefined, extra?: RequestExtraArgs | undefined): string | RequestConfig<string>;
    (config: {
        useCore: string;
    }): (url: string, data?: RequestData, method?: Method, extra?: RequestExtraArgs | undefined) => string | RequestConfig<string>;
};
export {};
