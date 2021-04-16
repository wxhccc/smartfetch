/* eslint-env node, jest */
import smartfetch, { SmartFetch, request } from '../dist/index.esm'

// 测试导出项是否正确
describe("exports test", () => {
  it("the SmartFetch export should be an instance of Class(Function)", () => {
    expect(SmartFetch).toBeInstanceOf(Function);
  });

  it("the default export should be an instance of class SmartFetch", () => {
    expect(smartfetch).toBeInstanceOf(SmartFetch);
  });

  it("the request export should be a function", () => {
    expect(request).toBeInstanceOf(Function);
  });

});

// 测试功能是否正确
describe("test request method", () => {
  describe("with out baseConfigs set", () => {
    it('test request return link url', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 }, 'GET', true)).toBe('http://aaa.aa/aaa?a=1');
    })
    it('test request with GET method return', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 })).toMatchObject({ method: 'GET', url: "http://aaa.aa/aaa?a=1" });
    })

    it('test request with POST method return(json)', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 }, 'POST')).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"a":1}'
      });
    })

    it('test request with POST method return(urlencode)', () => {
      expect(request('http://aaa.aa/aaa', { a: 1 }, 'POST', false, 'urlencode')).toMatchObject({
        url: 'http://aaa.aa/aaa',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'a=1'
      });
    })

  })

  describe("with baseConfigs set", () => {
    smartfetch.resetOpts({
      baseConfigs: { baseURL: 'https://aaa.aa' }
    })
    it('test request return link url whick will concat baseURL', () => {
      expect(request('/aaa', { a: 1 }, 'GET', true)).toBe('https://aaa.aa/aaa?a=1');
    })
  })

});
