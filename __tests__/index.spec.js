/* eslint-env node, jest */
import axios from 'axios'
import smartfetch, { SmartFetch, request, wp } from '../'

window.alert = jest.fn()

const testApi = 'https://api.github.com/repos/ant-design/ant-design'

// 测试导出项是否正确
describe('exports test', () => {
  it('the SmartFetch export should be an instance of Class(Function)', () => {
    expect(SmartFetch).toBeInstanceOf(Function)
  })

  it('the default export should be an instance of class SmartFetch', () => {
    expect(smartfetch).toBeInstanceOf(SmartFetch)
  })

  it('the request export should be a function', () => {
    expect(request).toBeInstanceOf(Function)
  })
})

// 测试request函数是否正常
describe('test request method', () => {
  describe('with out baseConfigs set', () => {
    it('test request return link url', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 }, 'GET', true)).toBe(
        'http://aaa.aa/aaa?a=1'
      )
    })
    it('test request with GET method return', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 })).toMatchObject({
        method: 'GET',
        url: 'http://aaa.aa/aaa?a=1'
      })
    })

    it('test request with POST method return(json)', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 }, 'POST')).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"a":1}'
      })
    })

    it('test request with POST method return(urlencode)', () => {
      expect(
        request('http://aaa.aa/aaa', { a: 1 }, 'POST', { enctype: 'urlencode' })
      ).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'a=1'
      })
    })
  })

  describe('with baseConfigs set', () => {
    it('test request return link url whick will concat baseURL', () => {
      smartfetch.resetOptions({ baseConfigs: { baseURL: 'https://aaa.aa' } })
      expect(request('/aaa', { a: 1 }, 'GET', true)).toBe(
        'https://aaa.aa/aaa?a=1'
      )
      smartfetch.resetOptions({}, true)
    })
  })
})

// 测试smartfetch是否正常工作
describe('test default export smartfetch object', () => {
  describe('Method: fetch', () => {
    it('will return a promise object', () => {
      expect(smartfetch.fetch()).toBeInstanceOf(Promise)
    })
    it('will return [Error, undefined] if somthing wrong had happend', async () => {
      const [error, res] = await smartfetch.fetch('http://fasfasfsfsdfa/dsafsf')
      expect(error).toBeInstanceOf(Error)
      expect(res).toBe(undefined)
    })
    it('will return [null, data] if fetch success(without code check and custom done handlers)', async () => {
      const [error, data] = await smartfetch.fetch({
        url: 'http://www.163.com',
        responseType: 'text'
      })
      expect(error).toBe(null)
      expect(data).toBeTruthy()
    })

    it('will recieved json object in done handler if fetch success for json api', () => {
      return smartfetch.fetch(testApi).done((data) => {
        expect(data).toHaveProperty('id')
      })
    })

    it('will recieved error object in faile handler if fetch failed', () => {
      return smartfetch.fetch('http://www.163.com').faile((error) => {
        expect(error).toBeInstanceOf(Error)
      })
    })

    it('fetch method use axios core(default global.fetch if supported)', async () => {
      smartfetch.resetOptions({ forceAxios: true })
      const [, data] = await smartfetch.fetch(testApi)
      expect(data).toBeTruthy()
      smartfetch.resetOptions({}, true)
    })
  })

  describe('Method: lock (test in global environment)', () => {
    it('test inner lock object can work', async () => {
      expect(wp._checkLockKey('locking')).toBeFalsy()
      await smartfetch
        .fetch(testApi)
        .lock('locking')
        .done(() => {
          expect(wp._checkLockKey('locking')).toBe(true)
        })
      expect(wp._checkLockKey('locking')).toBe(false)
    })

    it('test offer local object variable to lock', async () => {
      const lockKeys = {}
      await smartfetch
        .fetch(testApi)
        .lock([lockKeys, 'loading'])
        .done(() => {
          expect(lockKeys).toHaveProperty('loading', true)
        })
      expect(lockKeys).toHaveProperty('loading', false)
    })

    it('test offer a function to handle', async () => {
      const setLock = jest.fn()
      await smartfetch.fetch(testApi).lock(setLock)
      expect(setLock).toHaveBeenNthCalledWith(1, true)
      expect(setLock).toHaveBeenNthCalledWith(2, false)
    })

    it('test whether lock can stop muilt fetch at same time', () => {
      const doneFn = jest.fn()
      return Promise.all([
        smartfetch.fetch(testApi).lock('locking').done(doneFn),
        smartfetch.fetch(testApi).lock('locking').done(doneFn)
      ]).then(() => {
        expect(doneFn).toBeCalledTimes(1)
      })
    })
  })

  describe('Method: resetOptions', () => {
    it('test reset options can work', () => {
      expect(smartfetch.options).toStrictEqual({})
      const newOptions = {
        forceAxios: true,
        baseConfigs: { baseURL: 'https://www.basfasfaege.dfege' }
      }
      smartfetch.resetOptions(newOptions)
      expect(smartfetch.options).toStrictEqual(newOptions)
      smartfetch.resetOptions({}, true)
    })
    it('test reset will update instance inner state', () => {
      expect(smartfetch.$core).not.toHaveProperty('prototype')
      smartfetch.resetOptions({ forceAxios: true })
      expect(smartfetch.$core).toBe(axios)
      smartfetch.resetOptions({}, true)
    })
  })
})
