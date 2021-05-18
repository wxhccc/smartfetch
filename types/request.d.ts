import { Method } from 'axios';
import { RequestConfig, RequestData, SfRequestConfig } from './types';
declare type EnctypeType = 'json' | 'urlencode' | 'text' | 'none';
export interface RequestExtraArgs {
    useCore?: string;
    enctype?: EnctypeType;
}
export default function (config: SfRequestConfig): {
    <P extends Record<string, any> = RequestData>(url: string, data?: P | undefined, method?: Method | undefined, extra?: RequestExtraArgs | undefined): RequestConfig<string>;
    <P_1 extends Record<string, any> = RequestData>(url: string, data: P_1 | undefined, method: Extract<Method, 'GET' | 'HEAD'>, returnLink: true): string;
};
export {};
