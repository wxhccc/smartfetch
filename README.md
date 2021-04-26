# smartfetch

基于fetch和axios封装的通用接口处理插件，可以处理非常通用的接口使用情况，提供多个不同域名基础地址切换能力

> support vue3 and react hook from 2.0


# Installing

use npm 
```
$ npm install @wxhccc/smartfetch -S
```
use yarn
```
$ yarn add @wxhccc/smartfetch
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
      baseURL: 'url1'
    },
    {
      key: 'upload'
      baseURL: 'url2'
    }
  ]*/
  baseData: {},  // 基础数据，会随着所有请求发送，适合无法再header里添加token的场景。 可以为数据对象，或者函数
  errorHandler: notifyMsg, // 统一错误处理，优先级低于codeError
  statusWarn: statusMsgs, // response对象status值转换对象，用于自定义status文案
  responseCheck: 'success', // 返回值检测，用于过滤通用接口数据， 可以为函数
  forceAxios: true, // 是否强制使用axios核心发送请求，默认false
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

Vue.use(smartfetch, useConfig);
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

app.use(smartfetch, useConfig);
...
```


then use in the component 

```
	<button :disabled="loading">{loading ? 'sending' : 'send'}</buttom>
...
	data () {
	  return {
	  	loading: false
	  }
	}
...
	mounted() {
	  this.$fetch({url: 'api/test', data: {user: 'aaa'}})
	  	  .lock('loading')  // 发送请求前锁住当前实例状态中的loading字段，请求完成后（成功/失败）会释放
	  	  .done((data) => { 
          /* 
            接口请求成功且通过业务逻辑检测(业务逻辑检测可关闭)后运行，参数为返回数据的payload，例如：接口返回{ code: 2000, message: '', data: { id: 111} }，data就是{ id: 111}
          */
	  	  	// todo
	  	  })
	  	  .silence() /* 静默接口，会忽略所有错误处理逻辑（faile函数仍能获取错误信息），适用于不需要或不适合弹出错误提示的场景 */
	  	  .faile((error)=>{
          /* 如果你需要自己处理特定接口的错误，可使用此函数 */
	  	  }) 
	  	  .notCheckCode() /* 不进行业务逻辑code检测，适用于调用第三方接口或返回值和系统约定结构不一致的场景 */
        .finally(() => {
          /* 接口调用无论成功或失败都会执行的代码 */
        })
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

export smartfetch.fetch
...
```


then use in the (Class Component)

```
import { fetch } from 'xxx/xxxx.js'
...
	this.state = { loading: false }
  this.$fetch = fetch.bind(this)
...

...
	getDataList = () => {
	  this.$fetch({url: 'api/test', data: {user: 'aaa'}})
	  	  .lock('loading')
	}
...
```

then use in the Hook Component

```
import { fetch } from 'xxx/xxxx.js'
...
	const [loading, setLoading] = useState(false)

...

	const getDataList = () => {
	  this.$fetch({url: 'api/test', data: {user: 'aaa'}})
	  	  .lock(setLoading)
	}
  /*
    state更新可能是异步的，lock可能无法阻止同时触发的接口调用。可以使用lock的第二个参数，以hook为例，class类似
  */
  const locking = useRef(false)
  const getDataListLock = () => {
    this.$fetch({url: 'api/test', data: {user: 'aaa'}})
	  	  .lock(setLoading, [locking, 'value'])
  }
...
```

# API document

## options 基础配置对象

**baseConfigs**: 基础配置对象. 可用来设置统一的 *baseURL* 、 *headers* 等.(fetch方式只处理这两个属性) 接收对象或对象数组

*示例：*
```
// 使用对象方式，单一配置项
baseConfigs: {
  baseURL: 'http://a.b.com',
  headers: {x-token: 'xxxxxxx'}
}
/* 使用数组，多配置项，此时对象中key为必须字段
** *default* 是key的特殊值, key为default的配置项为默认配置项
** 可以使用 **useCore(key)** 方法切换配置项
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

**responseCheck**: 业务逻辑检测,适用于接口有统一数据结构，例如`{ success: true, code: 200, message: '', data: {} }`。接受字符串或函数，为字符串时或判断对象里指定key对应value值是否为真值

*示例：*
```
// 使用字符串时，会检查responseData[resCheck]是否是真值
responseCheck: 'success'

// 使用函数，参数为请求响应对象中的数据对象
resCheck: (responseData) => {
  return responseData.code === 200
}
```

**dataKey**: 统一结构下实际数据值的key，默认为`data`

**forceAxios**: 是否强制使用axios为请求核心，默认为`false`

**codeErrorHandler**: 业务逻辑检测失败时的处理函数，resCheck检测失败时触发，优先级高于errorHandle处理函数. 可以处理登录失效等情况

*示例：*
```
codeErrorHandler: (resJson) => {
  // to do
}
```
## request

插件导出的工具方法，用于简化请求参数和让接口定义更规范化

*参数：*

* @url(string)：接口路径，可使用完整路径，也可使用相对于baseUrl的相对路径
* @data(object/FormData): 请求参数，仅支持plain object. formData  
* @method(string): 请求方式，支持所有请求方式，例如GET、POST等，全大写，默认`GET`  
* @extra(object) 额外的参数
  * @returnLink(boolean)：是否返回完整链接，仅对GET,HEAD方式有效，函数调用后不发起请求，会返回拼接好的携带参数的url地址。常用作下载或导出链接  
  * @enctype(string)：请求编码方式（content-type设定值），json = 'application/json', urlencode: 'application/x-www-form-urlencoded', text: 'text/plain'，默认为`json`  

## request(config)
用于设置request函数配置的高阶函数，会返回request函数

*高阶函数参数：*

* @config(object) 用于配置request的对象
  * useCore: 用于发送请求的配置项的key

如何使用
```
import { request } from '@wxhccc/smartfetch'
//// 例 1:
// 正常请求
const args = request('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)

//// 例 2:
// 返回链接
const linkUrl = request('api/getxxx', {a: 1, b: 2}, 'GET', { returnLink: true })
// linkUrl: http://a.b.com/api/getxxx?a=1&b=2

//// 例 3:
// 高阶函数方式，request({})调用后会返回修改配置后的request函数本身，用于在定义时指定请求使用的配置项
const args = request({useCore: 'upload'})('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)
// 请求会使用key为upload的配置项, 例如'http://a.bcd.com/api/getxxx'

```

### 推荐模式

在独立文件中定义接口函数
```
import { request } from '@wxhccc/smartfetch'

export function getUserList (data) {
  return request('api/users', data)
}
export function addUser (data) {
  return request('api/users', data, 'PUT')
}
```

在指定路由页面
```
...
// 从指定文件中引入接口函数
import { getUserList } from '@/api/xxxx'
...

this.$fetch(getUserList({ xxx: 'xxx' })).lock('loading').done(data => {
  // to do
})

```


## fetch
请求发起函数

使用方式

**使用实例方式，无依赖环境**
```
import { SmartFetch } from '@wxhccc/smartfetch'

const options = {
  // configs
}
const smartfetch = new SmartFetch(options)

smartfetch.fetch({
  url: 'api/getxxx',
  data: { a: 1 }
})

```

### smartfetch实例方法
以下为smartFetch类示例方法列表

**resetOpts**

说明: 用来重置示例配置
参数： @options(object)，配置对象，具体说明见上


**fetch**

说明: 请求发起函数  
参数

*方式一*

* @config(object) 请求对象

*方式二*

* 第一个参数非对象时会内部调用requset来得到config, 具体见request普通参数列表


如何使用
```
//// 例 1:
// if the first argument is object
const args = {
  url: 'api/getxxx',
  data: {a: 1, b: 2},
  method: 'POST')
}
this.$fetch(args)
// or
smartfetch.fetch(args)

//// 例 2:
// if the first argument is a string , fetch will use *request* to handle arguments
this.$fetch('api/getxxx', {a: 1, b: 2}, 'GET')


```
**modifyBaseConfigs**

说明: 你可以使用此函数来修改基础配置项  
参数： 基础配置项对象/数组

如何使用
```
import smartfetch from '@wxhccc/smartfetch'
smartfetch.modifyBaseConfigs(baseConfigs => {
  // single config
  baseConfigs.headers.token = 'xxx'
  // configs array
  baseConfigs.forEach(item => {
    item.headers.token = 'xxx'
  })
})

```

## fetch函数返回示例的方法列表

> 说明：fetch 会返回一个扩展了特定方法的promise对象，实例内会有内置的错误处理逻辑，所以promise不会reject。

**lock**

说明： 重要常用函数。用来锁住当前实例上下文中指定key的变量，在发起请求前设置成true，请求完成后设置为false。可用来处理loading状态和防多点需求
params: @key(string|function|[refObject, string], [refObject, string]): 实例上指定属性名，支持`.`写法写法，如a.b

如何使用
```
// use in vuejs
...
data: () {
  return {
    loading: false
  }
}
...
  this.$fetch('api/getxxx', data).lock('loading')

  setLoading = (lock) => { ... }
  this.$fetch('api/getxxx', data).lock(setLoading)

  const refs = { loading: false }
  this.$fetch('api/getxxx', data).lock([refs, 'loading'])

  // for async state update like react
  this.$fetch('api/getxxx', data).lock(setLoading, [refs, 'loading'])

```

**useCore**

说明: 用于切换基础配置

params: @key(string): baseConfig key

```
  this.$fetch(arg).useCore('upload')
```

**silence**

说明: 开启静默模式

**notCheckCode**

说明: 不进行业务逻辑检测，适用于调用第三方接口

**done**

说明: 请求成功后，并且通过业务逻辑检测（如果有的话）后会执行参数传入的回调函数, 可以链式连接多个

params: @callback(function) 回调函数，参数为返回数据中指定key对应内容 @data(any)
        
**faile**

说明: 请求成功后，并且通过业务逻辑检测（如果有的话）后会执行参数传入的回调函数，只能有一个

params: @callback(function) 回调函数，参数为错误对象error


