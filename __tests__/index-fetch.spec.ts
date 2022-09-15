import smartfetch, {
  winFetch,
  createRequestConfig,
  returnRequestLink,
  smartFetchCreator
} from '../src/index-fetch'

window.alert = jest.fn()

const testApi = 'https://api.github.com/repos/ant-design/ant-design'

// 测试导出项是否正确
describe('exports test', () => {
  it('the smartFetchCreator is export creator function', () => {
    expect(smartFetchCreator).toBeInstanceOf(Function)
  })
  it('the default export should be an object created by smartFetchCreator', () => {
    expect(Object.keys(smartfetch)).toEqual(Object.keys(smartFetchCreator()))
  })
})

// 测试request模块内函数是否正常
describe('test request method', () => {
  describe('with out baseConfigs set', () => {
    it('test request return link url', () => {
      expect(returnRequestLink('http://aaa.aa/aaa', { a: 1 })).toBe(
        'http://aaa.aa/aaa?a=1'
      )
    })
    it('test request with GET method return', () => {
      expect(createRequestConfig('http://aaa.aa/aaa', { a: 1 })).toMatchObject({
        method: 'GET',
        url: 'http://aaa.aa/aaa',
        params: { a: 1 }
      })
    })

    it('test request with POST method return(json)', () => {
      expect(
        createRequestConfig('http://aaa.aa/aaa', { a: 1 }, 'POST')
      ).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { a: 1 }
      })
    })

    it('test request with POST method return(urlencode)', () => {
      expect(
        createRequestConfig('http://aaa.aa/aaa', { a: 1 }, 'POST', {
          enctype: 'urlencode'
        })
      ).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: { a: 1 }
      })
    })
  })

  describe('with baseConfigs set', () => {
    it('test request return link url whick will concat baseURL', () => {
      smartfetch.resetOptions({ baseConfigs: { baseURL: 'https://aaa.aa' } })
      expect(returnRequestLink('/aaa', { a: 1 })).toBe('https://aaa.aa/aaa?a=1')
      smartfetch.resetOptions({}, true)
    })
  })
})

// // 测试smartfetch是否正常工作
describe('test root smartfetch instance', () => {
  describe('Method: fetch', () => {
    it('will return a promise object', () => {
      expect(winFetch({})).toBeInstanceOf(Promise)
    })
    it('will return [Error, undefined] if somthing wrong had happend', async () => {
      const [error, res] = await winFetch('http://fasfasfsfsdfa/dsafsf')
      expect(error).toBeInstanceOf(Error)
      expect(res).toBe(undefined)
    })
    it('will return [null, data] if fetch success(without code check and custom done handlers)', async () => {
      const [error, data] = await winFetch({
        url: 'http://www.163.com',
        responseType: 'blob'
      })
      expect(error).toBe(null)
      expect(data).toBeTruthy()
    })
  })

  describe('Method: lock (test in global environment)', () => {
    it('test offer a function to handle', async () => {
      const setLock = jest.fn()
      await winFetch({ url: testApi }, { lock: setLock })
      expect(setLock).toHaveBeenNthCalledWith(1, true)
      expect(setLock).toHaveBeenNthCalledWith(2, false)
    })

    it('test whether lock can stop muilt fetch at same time', () => {
      const state = { locking: false }
      return Promise.all([
        winFetch({ url: testApi }, { lock: [state, 'locking'] }),
        winFetch({ url: testApi }, { lock: [state, 'locking'] })
      ]).then(([res1, res2]) => {
        expect(res1).toBeTruthy()
        expect(res2[1]).toBeFalsy()
      })
    })
  })

  describe('Method: resetOptions', () => {
    it('test reset options can work', () => {
      expect(smartfetch.getOptions()).toStrictEqual({})
      const newOptions = {
        baseConfigs: { baseURL: 'https://www.basfasfaege.dfege' }
      }
      smartfetch.resetOptions(newOptions)
      expect(smartfetch.getOptions()).toStrictEqual(newOptions)
      smartfetch.resetOptions({}, true)
    })
  })
})
