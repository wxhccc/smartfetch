import { AxiosInstance } from 'axios';
import { BaseConfig, FetchCore, RequestConfig, SmartFetchOptions } from './types';
import { AppContext } from 'vue';
import { VueConstructor } from 'vue2/types/vue';
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
    fetch: (this: any, ...args: any[]) => import("./types").PromiseWithMethods<any>;
    install(appOrVue: AppContext | VueConstructor, options: SmartFetchOptions): void;
    modifyBaseConfigs(handler: (baseConfigs: Record<string, BaseConfig>) => never): void;
    resetOpts(options?: SmartFetchOptions): void;
}
declare const rootInstance: SmartFetch;
export declare const request: {
    (url: string, data?: import("./types").RequestData | undefined, method?: import("axios").Method | undefined, returnLink?: boolean | undefined, enctype?: ("json" | "text" | "urlencode") | undefined): string | RequestConfig<string>;
    (config: {
        useCore: string;
    }): (url: string, data?: import("./types").RequestData, method?: import("axios").Method, returnLink?: boolean, enctype?: "json" | "text" | "urlencode") => string | RequestConfig<string>;
};
export default rootInstance;
