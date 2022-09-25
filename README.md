# smartfetch

基于fetch和axios封装的通用接口处理插件，可以处理项目级接口统一处理逻辑，并提供多个不同域名基础地址切换能力。

v4.0版本完成和axios解耦，同时提供了使用自定义异步请求API/库作为核心的能力。


# Installing

use npm 
```
$ npm install @wxhccc/smartfetch@next -S
```
use yarn
```
$ yarn add @wxhccc/smartfetch@next
```

# documents

* [english](./README.en.md)
* [中文文档](./README.md)

# 使用示例

> 在vue2中使用

install the plugin in main.js

```
import Vue from 'vue'
...
import smartfetch from '@wxhccc/smartfetch'

/** 配置文件推荐使用独立文件 **/

import { Notification } from 'element-ui';  // 错误提示可按需求选择ui库组件实现
const statusMsgs = {
  '404': '请求地址不存在',
  '500': '服务器维护中，请稍后再试'
};
const codeMsgs = {
  'E001': '未登录'
};
const useConfig = {
  baseConfigs: {  // 基础配置对象，多份配置可使用数组
    baseURL: ''
  },
  /*baseConfigs: [  // 多配置时key是必须的，用来切换配置
    {
      key: 'default',  // 'default' 是默认配置的key
      headers: { Authorization: 'aaa' } // 请求头部额外信息
      baseURL: 'url1'
    },
    {
      key: 'upload'
      baseURL: 'url2'
      headers: () => { Authorization: 'aaa' } // 请求头部额外信息
    }
  ]*/
  baseData: {},  // 基础数据，会随着所有请求发送，适合无法在header里添加token的场景。 可以为数据对象，或者函数
  errorHandler: notifyMsg, // 统一错误处理，优先级低于codeError
  statusWarn: statusMsgs, // response对象status值转换对象，用于自定义status文案
  responseCodeCheck: 'success', // 返回值检测，用于过滤通用接口数据， 可以为函数
  dataKey: 'data',  // 数据字段，默认'data'
  codeErrorHandler: (resjson) => { /* 业务逻辑错误码处理函数, resCheck检测未通过时会执行 */ 
    let {errorCode, errorMsg} = resjson;
    let msg = errorMsg || '请求失败';
    if (codeMsgs.hasOwnProperty(errorCode)) {
      let valType = typeof codeMsgs[errorCode];
      if (valType === 'string') {
        msg = codeMsgs[errorCode];
        notifyMsg(msg);
      } else if(valType === 'function') {
        codeMsgs[errorCode]();
      }
    } else {
      notifyMsg(msg);
    }
  }
}

smartfetch.resetOptions(useConfig)
...
```

>在vue3中使用

install the plugin in main.js

```
...
const app = createApp(App)
...
import smartfetch from '@wxhccc/smartfetch'

const useConfig = {
  ...
}
smartfetch.resetOptions(useConfig)

...
```


then use in the component 

```
	<button :disabled="loading">{loading ? 'sending' : 'send'}</buttom>
...
import { winFetch } from '@wxhccc/smartfetch'

	setup () {
    const loading = ref(false)

    const getRemoteData = async () => {
      // 发送请求前锁住当前实例状态中的loading字段，请求完成后（成功/失败）会释放
	    const [err, data] = await winFetch({url: 'api/test', data: {user: 'aaa'}}, {
        lock: [loading, 'value'],
        /* 静默接口，会忽略所有错误处理逻辑（faile函数仍能获取错误信息），适用于不需要或不适合弹出错误提示的场景 */
        silence: true
        /* 不进行业务逻辑code检测，适用于调用第三方接口或返回值和系统约定结构不一致的场景 */
        notCheckCode: true
      }) 
      /* 如果err不为null则表示有错误 */
      /** 如果lock锁定下重复调用函数，error为null, data为undefined */
      /* 
        接口请求成功且通过业务逻辑检测(业务逻辑检测可关闭)后运行，参数为返回数据的payload，例如：接口返回{ code: 2000, message: '', data: { id: 111} }，data就是{ id: 111}
      */
      // todo
    }

        
	  return { loading }
	}
...
```

> react 中使用

在utils或其他目录下创建文件
```
// xxx/xxxx.js
import smartfetch from '@wxhccc/smartfetch'

const useConfig = {
  ...
}

smartfetch.resetOptions(useConfig);

...
```


then use in the (Class Component)

```
import { winFetch } from '@wxhccc/smartfetch'
...
	this.state = { loading: false }
...

...
	getDataList = () => {
    const setLoading = (bool) => this.setState({ loading: bool })
	  winFetch({url: 'api/test', data: {user: 'aaa'}}, { lock: setLoading })
	}
...
```

then use in the Hook Component

```
import { winFetch } from '@wxhccc/smartfetch'
...
	const [loading, setLoading] = useState(false)

...

	const getDataList = () => {
	  fetch({url: 'api/test', data: {user: 'aaa'}}, { lock: setLoading })
	}
  /*
    state更新可能是异步的，lock可能无法阻止同时触发的接口调用。如果需要可以使用数组形式的lock的参数，以hook为例，class类似
  */
  const locking = useRef(false)
  const getDataListLock = () => {
    const setLocking = (bool) => {
      setLoading(bool)
      locking.current = bool
    }
    fetch({url: 'api/test', data: {user: 'aaa'}}, {
      lock: setLoading,
      syncRefHandle: [locking, 'current']
    })
  }
...
```

# API document

## options 基础配置对象

**baseConfigs**: 基础配置对象. 可用来设置统一的 *baseURL* 、 *headers* 等. 接收对象或对象数组

*示例：*
```
// 使用对象方式，单一配置项
baseConfigs: {
  baseURL: 'http://a.b.com',
  headers: {x-token: 'xxxxxxx'}
}
/* 使用数组，多配置项，此时对象中key为必须字段
** *default* 是key的特殊值, key为default的配置项为默认配置项
** 可以使用 **useConfig: key** 方法切换配置项
*/
baseConfigs: [
  {
    key: 'default',  
    baseURL: 'http://a.b.com'
  }, {
    key: 'upload',
    baseURL: 'http://a.bcd.com'
  }
]
```
ps: 在一些场景下，你可能在初始化之后才能获取基础配置信息，比如登录后才能获取token。这时你可以使用实例上的 "modifyBaseConfigs" 方法来修改基础配置（详细用法后面介绍）
3.0版本后，如果是需要动态headers数据，可以使用函数返回

**baseData**: 基础请求数据，会合并到所有请求中。适用于特殊情况无法通过headers附带的数据，比如未支持特定header的cors接口。可支持对象或函数

*示例：*
```
// 使用对象
baseData: {
  token: 'xxxxxxxxxxx',
}
// 使用函数

baseData: () => {
  const token = Math.random();
  return {
    token
  }
}
```
**errorHandler**: 通用错误提示函数，用来显示/处理接口调用过程中的错误信息

*参数：*

* @message(string)：插件处理过后的错误提示,可直接使用插件显示
* @error(Error)： 错误对象，如果需要自己处理特定错误可使用
  > error可能是TypeError（请求发送前失败，axios核心下是Error），SyntaxError(语法错误，比如接口返回json字符串格式错误)，RangeError(status值不在有效返回，有效范围通过配置项中的validateStatus参数设置)，CodeError(业务逻辑code检测失败)，CallbackSyntaxError(done或faile函数的回调函数中存在语法错误)等类型
* @response(HTTP response): 请求响应对象，可用于获取status具体值

*示例：*

```
errorHandler: (msg, error) => {
  alert(msg)
  /* or 
  Notification.error({
    title: '系统提示',
    message: msg
  }) // element-ui库中组件
  */
}
```

**statusWarn**: http协议中响应对象中状态码（status）对应提示文案，用于定制特定的status提示语

*示例：*
```
statusWarn: {
  '401': '亲，未登录无法访问哟！',
  '404': '抱歉接口地址不存在'
  ....
}
```

**statusHandler**: http协议中状态码错误时的处理逻辑，主要用于处理401等鉴权状态

**responseCodeCheck**: 业务逻辑检测,适用于接口有统一数据结构，例如`{ success: true, code: 200, message: '', data: {} }`。接受字符串或函数，为字符串时或判断对象里指定key对应value值是否为真值

*示例：*
```
// 使用字符串时，会检查responseData[resCheck]是否是真值
responseCodeCheck: 'success'

// 使用函数，参数为请求响应对象中的数据对象
resCheck: (responseData) => {
  return responseCodeCheck.code === 200
}
```

**dataKey**: 统一结构下实际数据值的key, 需配合responseCodeCheck使用，默认为`data`

**codeErrorHandler**: 业务逻辑检测失败时的处理函数，resCheck检测失败时触发，优先级高于errorHandle处理函数，低于statusHandler. 可以处理登录失效等情况

*示例：*
```
codeErrorHandler: (resJson) => {
  // to do
}
```
## createRequestConfig

插件导出的工具方法，是默认实例对象上的方法，用于简化请求参数和让接口定义更规范化。

*参数：*

* @url(string)：接口路径，可使用完整路径，也可使用相对于baseUrl的相对路径
* @data(object/FormData): 请求参数，仅支持plain object. formData  
* @method(string): 请求方式，支持所有请求方式，例如GET、POST等，全大写，默认`GET`  
* @returnLinkOrExtra(boolean | object) 是否返回链接字符串 或 额外的参数
  * @returnLink(boolean): 是否返回链接字符串
  * @useConfig(string)：替换之前的高阶函数方式，切换基础配置
  * @enctype(string)：请求编码方式（content-type设定值），json = 'application/json', urlencode: 'application/x-www-form-urlencoded', text: 'text/plain'，默认为`json`  



如何使用
```
import { createRequestConfig, returnRequestLink, winFetch, axiosFetch } from '@wxhccc/smartfetch'
//// 例 1:
// 正常请求，可以使用winFetch或axiosFetch
const config = createRequestConfig('api/getxxx', {a: 1, b: 2}, 'GET', { useFetch: true })
winFetch(config)
const config = createRequestConfig('api/getxxx', {a: 1, b: 2})
axiosFetch(config)

//// 例 2:
// 返回链接
const linkUrl = returnRequestLink('api/getxxx', {a: 1, b: 2})
// linkUrl: http://a.b.com/api/getxxx?a=1&b=2

//// 例 3:
const config = createRequestConfig('api/getxxx', {a: 1, b: 2}, 'GET', { useConfig: 'upload' })
axiosFetch(config)
// 请求会使用key为upload的配置项, 例如'http://a.bcd.com/api/getxxx'

```

### 推荐模式

> 方式一: 在独立文件中定义接口函数，函数仅生成配置

优点：所有接口调用使用的是winFetch/axiosFetch，可以方便定位
缺点：使用时需要引入winFetch/axiosFetch。 类型定义需要在调用时指定
```
import { createRequestConfig as request } from '@wxhccc/smartfetch'

export function getUserList (data) {
  return request('api/users', data)
}
export function addUser (data) {
  return request('api/users', data, 'PUT')
}
```

```
// 在其他页面使用
...
// 从指定文件中引入接口函数
import { winFetch } from '@wxhccc/smartfetch'
import { getUserList } from '@/api/xxxx'
...

const loading = { value: false }
const [err, data] = await winFetch<AnyType>(getUserList({ xxx: 'xxx' }), { lock: [loading, 'value'] })
// to do

```

> 方式二: 在独立文件中定义接口函数，使用辅助函数定义

优点：导出函数可以直接使用，同时具有类型定义
缺点：定义时较复杂，且必须返回config对象，同时无法确定页面内fetch函数位置
```
import { defineFetchApi, defineAxiosApi } from '@wxhccc/smartfetch'

export function getUserList (data) {
  return defineFetchApi<AnyType>(() => ({ url: 'api/users', data }))
}
export function addUser (data) {
  return defineAxiosApi<AnyType>(() => ({ url: 'api/users', method: 'PUT', data }))
}
```

```
// 在其他页面使用
...
// 从指定文件中引入接口函数=
import { getUserList } from '@/api/xxxx'
...

const loading = { value: false }
const [err, data] = await getUserList({ xxx: 'xxx' }, { lock: [loading, 'value'] })
// to do

```

## winFetch(如果引入的是index-fetch文件，则为fetch)
请求发起函数，是默认实例上的方法

使用方式

```
import { winFetch } from '@wxhccc/smartfetch'

winFetch({
  url: 'api/getxxx',
  data: { a: 1 }
})

import smartfetch from '@wxhccc/smartfetch/fetch'

smartfetch.fetch({
  url: 'api/getxxx',
  data: { a: 1 }
})

```

### smartfetch实例方法
以下为smartFetch类示例方法列表

**resetOptions**

说明: 用来重置示例配置
参数： @options(object)，配置对象，具体说明见上


**fetch(winFetch)/axiosFetch**

说明: 请求发起函数  
参数

*方式一*

* @config(object) 请求对象

*方式二*

* 第一个参数非对象时会内部调用requset来得到config, 具体见request普通参数列表


如何使用
```
// 例 1:
// if the first argument is object
const args = {
  url: 'api/getxxx',
  data: {a: 1, b: 2},
  method: 'POST')
}
// or
smartfetch.winFetch(args)

// 例 2:
// if the first argument is a string , fetch will use *request* to handle arguments
smartfetch.winFetch('api/getxxx', {a: 1, b: 2}, 'GET')

```

**modifyBaseConfigs**

说明: 你可以使用此函数来修改基础配置项  
参数： 基础配置项对象/数组

如何使用
```
import smartfetch from '@wxhccc/smartfetch'
smartfetch.modifyBaseConfigs(baseConfigs => {
  // single config
  baseConfigs.default.headers.token = 'xxx'
  // configs array
  Object.values(baseConfigs).forEach(item => {
    item.headers.token = 'xxx'
  })
})

```

> 说明：fetch 会返回promise对象，实例内会有内置的错误处理逻辑，所以promise不会reject。

## fetch函数配置参数对象

**lock**

说明： 重要常用函数。用来锁住当前实例上下文中指定key的变量，在发起请求前设置成true，请求完成后设置为false。可用来处理loading状态和防多点需求
params: setter function | [setter function, getter function]

**useConfig**

说明: 用于切换基础配置

params: @key(string): baseConfig key

```
  smartfetch.winFetch(arg, { useConfig: 'upload' })
```

**silence**

说明: 开启静默模式

**notCheckCode**

说明: 不进行业务逻辑检测，适用于调用第三方接口




