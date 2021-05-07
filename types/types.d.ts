import { PromiseWithLock, WpOptions, SyncRefHandle, LockSwitchHook } from '@wxhccc/es-util';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
export declare type SerializableObject = {
    [x: string]: SerializableObject | number | string | [] | Date;
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
export declare type BaseConfigWithKey = BaseConfig & {
    key: string;
};
export declare type BaseConfigs = BaseConfig | BaseConfigWithKey[];
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
export declare type FaileHandle = (e: Error) => unknown;
export interface LockMethod<T> {
    (key: string): PromiseWithMethods<T>;
    (syncRefHandle: SyncRefHandle): PromiseWithMethods<T>;
    (switchHook: LockSwitchHook, syncRefHandle?: [Record<string, boolean>, string]): PromiseWithMethods<T>;
}
export interface PromiseWithMethods<T> extends PromiseWithLock<T> {
    done: <T>(onfulfilled?: ((value: any) => T | PromiseLike<T>) | null | undefined) => PromiseWithMethods<T>;
    lock: LockMethod<T>;
    faile: (handler: FaileHandle) => Promise<T>;
    useCore: (corekey: string) => PromiseWithMethods<T>;
    silence: () => PromiseWithMethods<T>;
    notCheckCode: () => PromiseWithMethods<T>;
}
export declare type ContextType = 'unknown' | 'vue' | 'react';
export interface FetchOptions extends WpOptions {
    silence?: boolean;
    needCodeCheck?: boolean;
    failHandler?: FaileHandle;
}
export interface SFetch {
    <T>(config: RequestConfig, options?: FetchOptions): PromiseWithMethods<T>;
    <T>(url: string, data?: RequestData, method?: Method, options?: FetchOptions): PromiseWithMethods<T>;
}
export {};
