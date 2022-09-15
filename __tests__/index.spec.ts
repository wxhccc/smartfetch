import smartfetch, { axiosFetch } from '../src/index'

window.alert = jest.fn()

const testApi = 'https://api.github.com/repos/ant-design/ant-design'

// 测试axios相关功能是否正常工作
describe('test root smartfetch instance（axiosFetch only）', () => {
  describe('Method: fetch', () => {
    it('will return a promise object', () => {
      expect(axiosFetch({})).toBeInstanceOf(Promise)
    })
    it('will return [Error, undefined] if somthing wrong had happend', async () => {
      const [error, res] = await axiosFetch(
        'http://www.fasfasfsfsdfa.xxxxx/dsafsf'
      )
      expect(error).toBeInstanceOf(Error)
      expect(res).toBe(undefined)
    })
    it('will return [null, data] if fetch success(without code check and custom done handlers)', async () => {
      const [error, data] = await axiosFetch({
        url: testApi,
        responseType: 'blob'
      })
      expect(error).toBe(null)
      expect(data).toBeTruthy()
    })
  })

  describe('Method: lock (test in global environment)', () => {
    it('test offer a function to handle', async () => {
      const setLock = jest.fn()
      await axiosFetch({ url: testApi }, { lock: setLock })
      expect(setLock).toHaveBeenNthCalledWith(1, true)
      expect(setLock).toHaveBeenNthCalledWith(2, false)
    })

    it('test whether lock can stop muilt fetch at same time', () => {
      const state = { locking: false }
      return Promise.all([
        axiosFetch({ url: testApi }, { lock: [state, 'locking'] }),
        axiosFetch({ url: testApi }, { lock: [state, 'locking'] })
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
