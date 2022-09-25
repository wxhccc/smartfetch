import { vi, describe, it, expect } from 'vitest'
import smartfetch, {
  createRequestConfig,
  winFetch,
  axiosFetch,
  resetOptions,
  smartFetchCreator,
  smartFetchCoreCreator,
  defineFetchApi,
  defineAxiosApi
} from '../src/index'

window.alert = vi.fn()

const baseUrl = 'https://httpbin.org'
const testApi = 'https://httpbin.org/get'
const postTestApi = 'https://httpbin.org/post'
const statusTestApi = (status: number) => `https://httpbin.org/status/${status}`

// 完整测试window.fetch和axios共有功能是否正常工作
describe('test root smartfetch instance', () => {
  describe('Method: fetch（winFetch & axiosFetch）', () => {
    describe('base useages', () => {
      it('will return a promise object', () => {
        expect(winFetch({})).toBeInstanceOf(Promise)
        expect(axiosFetch({})).toBeInstanceOf(Promise)
      })
      it('will return [Error, undefined] if somthing wrong had happend', async () => {
        const url = 'http://www.fasfasfsfsdfa.xxxxx/dsafsf'
        const [error1, res1] = await winFetch(url)
        const [error2, res2] = await axiosFetch(url)
        expect(error1).toBeInstanceOf(Error)
        expect(res1).toBe(undefined)
        expect(error2).toBeInstanceOf(Error)
        expect(res2).toBe(undefined)
      })
      it('will return [null, data] if fetch success(without code check and custom done handlers)', async () => {
        const [error1, data1] = await winFetch(testApi)
        const [error2, data2] = await axiosFetch(testApi)
        expect(error1).toBe(null)
        expect(data1).toBeTruthy()
        expect(error2).toBe(null)
        expect(data2).toBeTruthy()
      })
    })

    describe('test fetch with params and use different method type', () => {
      it('test get method with params', async () => {
        const [, data1] = await winFetch(testApi, { a: 1 })
        const [, data2] = await axiosFetch(testApi, { a: 1 })
        expect(data1.url.includes('a=1')).toBe(true)
        expect(data2.url.includes('a=1')).toBe(true)
      })
      it('test get method with params of URLSearchParams', async () => {
        const params = new URLSearchParams({ a: '1' })
        const [, data1] = await winFetch(testApi, params)
        const [, data2] = await axiosFetch(testApi, params)
        expect(data1.url.includes('a=1')).toBe(true)
        expect(data2.url.includes('a=1')).toBe(true)
      })
      it('test post method with data', async () => {
        const [, data1] = await winFetch(postTestApi, { a: 1 }, 'POST')
        const [, data2] = await axiosFetch(postTestApi, { a: 1 }, 'POST')
        expect(data1.json).toEqual({ a: 1 })
        expect(data2.json).toEqual({ a: 1 })
      })
      it('test post method with params and data at same time', async () => {
        const config = {
          url: postTestApi,
          method: 'POST',
          params: { a: 1 },
          data: { b: 1 }
        }
        const [, data1] = await winFetch(config)
        const [, data2] = await axiosFetch(config)
        expect(data1.url.includes('a=1')).toBe(true)
        expect(data2.url.includes('a=1')).toBe(true)
        expect(data1.json).toEqual({ b: 1 })
        expect(data2.json).toEqual({ b: 1 })
      })
      it('test get method with custom headers', async () => {
        const config = {
          url: testApi,
          headers: { Authorization: '111111' }
        }
        const [, data1] = await winFetch(config)
        const [, data2] = await axiosFetch(config)
        expect(data1.headers).toMatchObject({ Authorization: '111111' })
        expect(data2.headers).toMatchObject({ Authorization: '111111' })
      })
      it('test timeout in request config object', async () => {
        const config = {
          url: 'https://httpbin.org/delay/2',
          timeout: 1000
        }
        const [error1] = await winFetch(config)
        const [error2] = await axiosFetch(config)
        expect(error1).toBeInstanceOf(Error)
        expect(error1?.name).toBe('AbortError')
        expect(error2).toBeInstanceOf(Error)
      })

      it('test response with bad status', async () => {
        const [error1] = await winFetch(statusTestApi(400))
        const [error2] = await axiosFetch(statusTestApi(400))
        const [error3] = await axiosFetch(statusTestApi(500))
        expect(error1?.name).toBe('StatusError')
        expect(error2?.code).toBe('ERR_BAD_REQUEST')
        expect(error3?.code).toBe('ERR_BAD_RESPONSE')
      })
    })

    describe('fetch options (this part have no related to fetch or axios, so will mix use winFetch and axiosFetch)', () => {
      describe('test lock & syncRefHandle', () => {
        it('test offer a function to handle', async () => {
          const setLock1 = vi.fn()
          const setLock2 = vi.fn()
          await winFetch({ url: testApi }, { lock: setLock1 })
          expect(setLock1).toHaveBeenNthCalledWith(1, true)
          expect(setLock1).toHaveBeenNthCalledWith(2, false)
          await axiosFetch({ url: testApi }, { lock: setLock2 })
          expect(setLock2).toHaveBeenNthCalledWith(1, true)
          expect(setLock2).toHaveBeenNthCalledWith(2, false)
        })

        it('test offer `syncRefHandle` to handle async state change', async () => {
          const setLock1 = vi.fn()
          const state = { locking: false }
          const promise = winFetch(
            { url: testApi },
            { lock: setLock1, syncRefHandle: [state, 'locking'] }
          )
          expect(state.locking).toBe(true)
          await promise
          expect(state.locking).toBe(false)
          expect(setLock1).toHaveBeenNthCalledWith(1, true)
          expect(setLock1).toHaveBeenNthCalledWith(2, false)
        })

        it('test whether lock can stop muilt fetch at same time', () => {
          const state = { locking: false }
          return Promise.all([
            axiosFetch({ url: testApi }, { lock: [state, 'locking'] }),
            axiosFetch({ url: testApi }, { lock: [state, 'locking'] })
          ]).then(([res1, res2]) => {
            expect(res1[1]).toBeTruthy()
            expect(res2[1]).toBeFalsy()
          })
        })
      })

      it('test useConfig(used to switch config item)', async () => {
        resetOptions({
          baseConfigs: [
            { key: 'default', baseURL: testApi },
            { key: 'errorUrl', baseURL: 'http://www.fasfasfsfsdfa.xxxxx' }
          ]
        })
        const config = { url: '' }
        const [error1, data] = await winFetch(config)
        expect(error1).toBeFalsy()
        const [error2] = await winFetch(config, { useConfig: 'errorUrl' })
        expect(error2).toBeInstanceOf(Error)
        resetOptions({}, true)
      })

      it('test silence', async () => {
        const errorHandler = vi.fn()
        resetOptions({
          errorHandler
        })
        const config = { url: 'http://www.fasfasfsfsdfa.xxxxx/dsafsf' }
        const [error1] = await winFetch(config)
        expect(error1).toBeInstanceOf(Error)
        expect(errorHandler).toHaveBeenCalled()
        const [error2] = await winFetch(config, { silence: true })
        expect(error2).toBeInstanceOf(Error)
        expect(errorHandler).toHaveBeenCalledTimes(1)
        resetOptions({}, true)
      })

      it('test needCodeCheck', async () => {
        resetOptions({
          responseCodeCheck: (res) => (res.url as string).includes('a=1')
        })
        const [error1] = await winFetch({ url: testApi })
        expect(error1?.name).toBe('CodeError')
        const [error2] = await winFetch(
          { url: testApi },
          { needCodeCheck: false }
        )
        expect(error2).toBeFalsy()
        resetOptions({}, true)
      })

      it('test paramsFilterNullable', async () => {
        const config = {
          url: testApi,
          params: { a: 1, b: undefined, c: null, d: '' }
        }
        const [, data1] = await winFetch(config)
        const [, data2] = await winFetch(config, { paramsFilterNullable: true })
        expect(data1.url.includes('a=1&d=')).toBe(true)
        expect(data2.url.includes('a=1&d=')).toBe(false)
      })

      it('test switchDataNull (useful for deconstruction)', async () => {
        const config = {
          url: postTestApi,
          method: 'POST',
          data: { a: 1, b: undefined, c: null, d: '' }
        }
        const [, data1] = await axiosFetch(config)
        const [, data2] = await axiosFetch(config, { switchDataNull: true })
        expect(data1.json).toEqual({ a: 1, c: null, d: '' })
        expect(data2.json).toEqual({ a: 1, c: undefined, d: '' })
      })
    })
  })

  describe('Method: resetOptions', () => {
    it('test reset options can work', () => {
      expect(smartfetch.getOptions()).toStrictEqual({})
      const newOptions = {
        baseConfigs: { baseURL: 'https://www.basfasfaege.dfege' }
      }
      resetOptions(newOptions)
      expect(smartfetch.getOptions()).toStrictEqual(newOptions)
      resetOptions({}, true)
    })

    describe('test root options of default export instance', () => {
      it('test baseData can work(object or function)', async () => {
        resetOptions({ baseData: { a: 1 } })
        const [, data1] = await winFetch(testApi)
        expect(data1.url.includes('a=1')).toBe(true)
        const [, data2] = await axiosFetch(postTestApi, undefined, 'POST')
        expect(data2.url.includes('a=1')).toBe(true)
        expect(data2.json).toEqual({ a: 1 })
        resetOptions({
          baseData: (useFetch, type) => {
            return type === 'data' ? { a: 1 } : {}
          }
        })
        const [, data3] = await axiosFetch(postTestApi, undefined, 'POST')
        expect(data3.url.includes('a=1')).toBe(false)
        expect(data3.json).toEqual({ a: 1 })
        smartfetch.resetOptions({}, true)
      })

      it('test validateStatus', async () => {
        const config = createRequestConfig(
          statusTestApi(300),
          undefined,
          'GET',
          { enctype: 'text', useFetch: true }
        )
        const [error1] = await winFetch(config)
        expect(error1?.name).toBe('StatusError')
        resetOptions({
          validateStatus: (status) => status >= 200 && status < 400
        })
        const [error2] = await winFetch(config)
        expect(error2).toBeFalsy()
        smartfetch.resetOptions({}, true)
      })

      it('test responseCodeCheck && dataKey', async () => {
        const [, data1] = await winFetch(testApi, { a: '1' })
        expect(data1.args).toEqual({ a: '1' })
        resetOptions({
          responseCodeCheck: (res) => (res.url as string).includes('a=1'),
          dataKey: 'args'
        })
        const [, data2] = await winFetch(testApi, { a: '1' })
        expect(data2).toEqual({ a: '1' })
        smartfetch.resetOptions({}, true)
      })

      it('test statusWarn', async () => {
        const errorHandler = vi.fn()
        resetOptions({ errorHandler })
        const [] = await winFetch(statusTestApi(404))
        const [msg1] = errorHandler.mock.lastCall || []
        expect(msg1).toBe('请求失败')
        resetOptions({ statusWarn: { 404: '请求地址不存在' } })
        const [] = await winFetch(statusTestApi(404))
        const [msg2] = errorHandler.mock.lastCall || []
        expect(msg2).toBe('请求地址不存在')
        smartfetch.resetOptions({}, true)
      })

      it('test codeErrorHandler', async () => {
        const codeErrorHandler = vi.fn()
        resetOptions({
          responseCodeCheck: (res) => (res.url as string).includes('a=1'),
          codeErrorHandler
        })
        const [] = await winFetch(testApi)
        expect(codeErrorHandler).toBeCalled()
        smartfetch.resetOptions({}, true)
      })

      it('test paramsFilterNullable & switchDataNull', async () => {
        resetOptions({ paramsFilterNullable: true, switchDataNull: true })
        const config = {
          url: postTestApi,
          method: 'POST',
          params: { a: 1, b: undefined, c: null, d: '' },
          data: { a: 1, b: undefined, c: null, d: '' }
        }
        const [, data1] = await winFetch(config)
        expect(data1.args).toEqual({ a: '1' })
        expect(data1.json).toEqual({ a: 1, c: undefined, d: '' })
        smartfetch.resetOptions({}, true)
      })

      describe('test statusHandler', () => {
        it('test statusHandler will work', async () => {
          const statusHandler = vi.fn()
          resetOptions({ statusHandler })
          await winFetch(statusTestApi(401))
          expect(statusHandler).toBeCalled()
          smartfetch.resetOptions({}, true)
        })

        it('test statusHandler return promise will work', async () => {
          const authHeaders: HeadersInit = {}
          const refreshToken = vi.fn(async () => {
            const [] = await winFetch(testApi)
            authHeaders.Authorization =
              'Bearer 1ee9b381-e71a-4e2f-8782-54ab1ce4d140'
          })
          const statusHandler = vi.fn((status) => {
            if (status === 401) {
              return refreshToken()
            }
          })
          const config = {
            url: 'https://httpbin.org/bearer',
            headers: authHeaders
          }
          const [error1] = await winFetch(config)
          expect(error1?.message).toContain('401')
          resetOptions({ statusHandler })
          const [error2] = await winFetch(config)
          expect(error2).toBeFalsy()
          const [status] = statusHandler.mock.lastCall || []
          expect(status).toBe(401)
          smartfetch.resetOptions({}, true)
        })
      })

      describe('test baseConfigs', () => {
        it('test only one base config', async () => {
          resetOptions({ baseConfigs: { baseURL: baseUrl, headers: { a: 1 } } })
          const [, data] = await winFetch('/get')
          expect(data.url).toBe(baseUrl + '/get')
          expect(data.headers).toMatchObject({ A: '1' })
          smartfetch.resetOptions({}, true)
        })

        it('test multi configs and switch config', async () => {
          resetOptions({
            baseConfigs: [
              { key: 'default', baseURL: baseUrl, headers: { a: 1 } },
              { key: 'config1', baseURL: baseUrl, headers: { b: 1 } }
            ]
          })
          const config = { url: '/get' }
          const [, data] = await winFetch(config)
          const [, data1] = await winFetch(config, { useConfig: 'config1' })
          expect(data.headers).toMatchObject({ A: '1' })
          expect(data1.headers).toMatchObject({ B: '1' })
          smartfetch.resetOptions({}, true)
        })

        it('test custom options set in base config item', async () => {
          resetOptions({
            baseConfigs: [
              { key: 'default', baseURL: baseUrl },
              { key: 'config1', baseURL: baseUrl, options: { dataKey: undefined } }
            ],
            responseCodeCheck: (res) => !!res.json,
            dataKey: 'json'
          })
          const config = { url: '/post', method: 'POST', data: { a: 1 } }
          const [, data] = await winFetch(config)
          const [, data1] = await winFetch(config, { useConfig: 'config1' })
          expect(data).toEqual({ a: 1 })
          expect(data1).not.toEqual({ a: 1 })
          expect(data1.json).toEqual({ a: 1 })
          smartfetch.resetOptions({}, true)
        })
      })
    })
  })
})

/** 测试实例创建器 */
describe('test smartFetchCreator', () => {
  it('the smartFetchCreator can create new instance', async () => {
    const instance = smartFetchCreator({
      baseConfigs: { baseURL: baseUrl, headers: { a: 1 } }
    })
    const [, data] = await instance.fetch('/get')
    const [, data1] = await instance.axiosFetch('/get')
    expect(data.url).toBe(baseUrl + '/get')
    expect(data.headers).toMatchObject({ A: '1' })
    expect(data1.url).toBe(baseUrl + '/get')
    expect(data1.headers).toMatchObject({ A: '1' })
  })
  it('test use new instance extends fetch method', async () => {
    const instance = smartFetchCreator()
    const customRequest = vi.fn(async () => {
      return { code: 0, data: { a: 1 }, message: '' }
    })
    const customFetchCore = smartFetchCoreCreator(customRequest)
    const customFetch = instance.coreFetchCreator(customFetchCore)
    const [, data] = await customFetch(testApi)
    expect(data).toEqual({ code: 0, data: { a: 1 }, message: '' })
  })
})

/** 测试api定义包裹 */
describe('test fetchApiWrapper', () => {
  it('the defineFetchApi', async () => {
    const api = defineFetchApi((id: number) => ({ url: testApi, params: { a: id } }))
    const setLock1 = vi.fn()
    const [error, data] = await api(1, { lock: setLock1 })
    expect(setLock1).toHaveBeenCalledWith(true)
    expect(setLock1).toHaveBeenCalledWith(false)
    expect(data.args).toEqual({ a: '1' })
  })
  it('test defineAxiosApi', async () => {
    const api = defineAxiosApi((id: number) => ({ url: testApi, params: { a: id } }))
    const setLock1 = vi.fn()
    const [error, data] = await api(1, { lock: setLock1 })
    expect(setLock1).toHaveBeenCalledWith(true)
    expect(setLock1).toHaveBeenCalledWith(false)
    expect(data.args).toEqual({ a: '1' })
  })
})