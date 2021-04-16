import { Method } from 'axios';
import { RequestConfig, RequestData, SfRequestConfig } from './types';
declare type EnctypeType = 'json' | 'urlencode' | 'text';
export interface CreateRequestConfig {
    (url: string, data?: RequestData, method?: Method, returnLink?: boolean, enctype?: EnctypeType): string | RequestConfig<string>;
}
export default function (config: SfRequestConfig): {
    (url: string, data?: RequestData | undefined, method?: Method | undefined, returnLink?: boolean | undefined, enctype?: EnctypeType | undefined): string | RequestConfig<string>;
    (config: {
        useCore: string;
    }): (url: string, data?: RequestData, method?: Method, returnLink?: boolean, enctype?: EnctypeType) => string | RequestConfig<string>;
};
export {};
