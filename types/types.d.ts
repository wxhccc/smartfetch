import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
export declare type SerializableObject = {
    [x: string]: SerializableObject | number | string | [];
};
export declare type RequestData = SerializableObject | FormData;
export interface BaseConfig extends AxiosRequestConfig {
    key?: string;
}
export declare type WinFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
export declare type FetchCore = AxiosInstance | WinFetch;
export interface RequestConfig<UseCore = 'default'> extends Omit<AxiosRequestConfig, 'headers'>, Omit<RequestInit, 'method'> {
    useCore?: UseCore;
}
export declare type BaseConfigs = BaseConfig | BaseConfig[];
export declare type MappedBaseConfigs = Record<string, BaseConfig>;
export declare type BaseData = Record<string, any> | (() => Record<string, any>);
export declare type FetchResponse = Response | AxiosResponse;
interface ErrorHandler {
    (message?: string, error?: Error, response?: FetchResponse): void;
}
interface CodeErrorHandler {
    (responseJson: SerializableObject): void;
}
export interface SmartFetchOptions {
    baseConfigs?: BaseConfigs;
    baseData?: SerializableObject | ((coreKey: string) => SerializableObject);
    errorHandler?: ErrorHandler;
    statusWarn?: {
        [key: number]: string;
    };
    validateStatus?: (status: number) => boolean;
    responseCheck?: string | ((responseJson: SerializableObject) => boolean);
    forceAxios?: boolean;
    dataKey?: string;
    codeErrorHandler?: CodeErrorHandler;
}
export interface SfRequestConfig {
    useFetch: boolean;
    options: SmartFetchOptions;
    baseConfigs: MappedBaseConfigs;
}
export interface PromiseWithMethods<T> extends Promise<T> {
    useCore?: (corekey: string) => PromiseWithMethods<T>;
    lock?: (key: string) => PromiseWithMethods<T>;
    silence?: () => PromiseWithMethods<T>;
    notCheckCode?: () => PromiseWithMethods<T>;
}
export declare type ContentType = 'default' | 'vue' | 'react';
export {};
