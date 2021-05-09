import { AxiosInstance, Method } from 'axios';
import { BaseConfig, FetchCore, RequestConfig, RequestData, SFetch, SmartFetchOptions } from './types';
export { wp } from '@wxhccc/es-util';
export declare class SmartFetch {
    private _fetchEnable;
    private _useFetch;
    get useFetch(): boolean;
    private _axiosCores;
    get axiosCores(): Record<string, AxiosInstance>;
    private _baseCfgs;
    get baseConfigs(): Record<string, BaseConfig>;
    private _statusMsgs;
    get statusMsgs(): {
        [key: string]: string;
    };
    $core: FetchCore;
    $curCfg: BaseConfig;
    private _options;
    get options(): SmartFetchOptions;
    constructor(options?: SmartFetchOptions);
    private _fetchCoreChoose;
    private _ajaxCoreSwitch;
    private _fetchCoreSetup;
    getAxiosCore(key: string): FetchCore;
    fetch: SFetch;
    install(appOrVue: any, options: SmartFetchOptions): void;
    modifyBaseConfigs(handler: (baseConfigs: Record<string, BaseConfig>) => never): void;
    resetOptions(options?: SmartFetchOptions, notAssign?: boolean): void;
}
declare const rootInstance: SmartFetch;
export declare const request: {
    (url: string, data?: RequestData | undefined, method?: Method | undefined, extra?: import("./request").RequestExtraArgs | undefined): string | RequestConfig<string>;
    (config: {
        useCore: string;
    }): (url: string, data?: RequestData, method?: Method, extra?: import("./request").RequestExtraArgs | undefined) => string | RequestConfig<string>;
};
export default rootInstance;
export * from './types';
export * from './vue-plugin';
