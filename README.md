# smartfetch
an easy use api plugin for vue and react.

# Installing

use npm 
```
$ npm install smartfetch
```

# 使用示例

在vuejs中使用

install the plugin in main.js

```
import Vue from 'vue'
...
import smartfetch from 'smartfetch'

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
  baseConfig: {  // 基础配置对象，多份配置可使用数组
    baseURL: ''
  },
  /*baseConfig: [  // 多配置时key是必须的，用来切换配置
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
  errorHandle: notifyMsg, // 统一错误处理，优先级低于codeError
  statusWarn: statusMsgs, // response对象status值转换对象，用于自定义status文案
  resCheck: 'success', // 返回值检测，用于过滤通用接口数据， 可以为函数
  forceAxios: true, // 是否强制使用axios核心发送请求，默认false
  dataKey: 'data',  // 数据字段，默认'data'
  codeError: (resjson) => { /* 业务逻辑错误码处理函数, resCheck检测未通过时会执行 */ 
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
use in the component 
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

# API document

## options 基础配置对象

**baseConfig**: 基础配置对象. 可用来设置统一的 *baseURL* 、 *headers* 等. 接收对象或对象数组

*示例：*
```
// 使用对象方式，单一配置项
baseConfig: {
  baseURL: 'http://a.b.com',
  headers: {x-token: 'xxxxxxx'}
}
/* 使用数组，多配置项，此时对象中key为必须字段
** *default* 是key的特殊值, key为default的配置项为默认配置项
** 可以使用 **useCore(key)** 方法切换配置项
*/
baseConfig: [
  {
    key: 'default',  
    baseURL: 'http://a.b.com'
  }, {
    key: 'upload',
    baseURL: 'http://a.bcd.com'
  }
]
```
ps: 在一些场景下，你可能在初始化之后才能获取基础配置信息，比如登录后才能获取token。这时你可以使用示例上的 "modifyBaseConfigs" 方法来修改基础配置（详细用法后面介绍）

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
**errorHandle**: 通用错误提示函数，用来显示/处理接口调用过程中的错误信息

*参数：*

* @message(string)：插件处理过后的错误提示,可直接使用插件显示
* @error(Error)： 错误对象，如果需要自己处理特定错误可使用
  > error可能是TypeError（请求发送前失败，axios核心下是Error），SyntaxError(语法错误，比如接口返回json字符串格式错误)，RangeError(status值不在有效返回，有效范围通过配置项中的validateStatus参数设置)，CodeError(业务逻辑code检测失败)，CallbackSyntaxError(done或faile函数的回调函数中存在语法错误)等类型
* @response(HTTP response): 请求响应对象，可用于获取status具体值

*示例：*

```
errorHandle: (msg, error) => {
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

**resCheck**: 业务逻辑检测,适用于接口有统一数据结构，例如`{ success: true, code: 200, message: '', data: {} }`。接受字符串或函数，为字符串时或判断对象里指定key对应value值是否为真值

*示例：*
```
// 使用字符串时，会检查responseData[resCheck]是否是真值
resCheck: 'success'

// 使用函数，参数为请求响应对象中的数据对象
resCheck: (responseData) => {
  return responseData.code === 200
}
```

**dataKey**: 统一结构下实际数据值的key，默认为`data`

**forceAxios**: 是否强制使用axios为请求核心，默认为`false`

**codeError**: 业务逻辑检测失败时的处理函数，resCheck检测失败时触发，优先级高于errorHandle处理函数

*示例：*
```
codeError: (resJson) => {
  // to do
}
```
## request

插件导出的工具方法，用于简化请求参数和让接口定义更规范化

*参数：*

* @url(string)：接口路径，可使用完整路径，也可使用相对于baseUrl的相对路径
* @data(object/FormData): 请求参数，仅支持plain object. formData  
* @method(string): 请求方式，支持所有请求方式，例如GET、POST等，全大写，默认`GET`  
* @returnLink(boolean)：是否返回完整链接，仅对GET,HEAD方式有效，函数调用后不发起请求，会返回拼接好的携带参数的url地址。常用作下载或导出链接  
* @enctype(string)：请求编码方式（content-type设定值），json = 'application/json', urlencode: 'application/x-www-form-urlencoded', text: 'text/plain'，默认为`json`  

## request(config)
用于设置request函数配置的高阶函数，会返回request函数

*高阶函数参数：*

* @config(object) 用于配置request的对象
  * useCore: 用于发送请求的配置项的key

如何使用
```
import { request } from 'smartfetch'
//// 例 1:
// 正常请求
const args = request('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)

//// 例 2:
// 返回链接
const linkUrl = request('api/getxxx', {a: 1, b: 2}, 'GET', true)
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
import { request } from 'smartfetch'

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

this.$fetch(getUserList, { xxx: 'xxx' }).lock('loading').done(data => {
  // to do
})

```


## fetch
请求发起函数

使用方式

**使用实例方式，无依赖环境**
```
import { SmartFetch } from 'smartfetch'

const options = {
  // configs
}
const smartfetch = SmartFetch(options)

smartfetch.fetch({
  url: 'api/getxxx',
  data: { a: 1 }
})

```
**在vuejs中使用**

在main.js中安装
```
...
import smartfetch from 'smartfetch'
const options = {
  // configs
}
Vue.use(smartfetch, options)
```
```
// 之后再各组件中使用$fetch发起请求
this.$fetch
...
```

### Smartfetch实例方法
以下为SmartFetch类示例方法列表

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

*方式三*

* @requestFn(function)， 第一个参数为使用request封装的函数时，后续参数会按顺序传递给requestFn

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

//// 例 3:
// if the first argument is a function , fetch will put rest arguments to the function, can use with request to make apis more clear
const request1 = function(data) {
  return request('api/getxxx', data, 'GET')
}
this.$fetch(request1, {a: 1, b: 2})


```
**modifyBaseConfigs**

说明: 你可以使用此函数来修改基础配置项  
参数： 基础配置项对象/数组

如何使用
```
import smartfetch from 'smartfetch'
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

说明：调用fetch函数后会返回一个请求代理对象，对象会提供下列方法，方法调用后会返回对象本身（除promise外），可使用链式调用。在所有链式同步代码执行完后开始发起请求，链式调用无先后顺序。

**lock**

说明： 重要常用函数。用来锁住当前实例上下文中指定key的变量，在发起请求前设置成true，请求完成后设置为false。可用来处理loading状态和防多点需求
params: @key(string): 实例上指定属性名，支持`.`写法写法，如a.b

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

// use in react
...
this.state = {
  loading: false
}
    
...
  smartfetch.fetch('api/getxxx', data).lock('loading')

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

说明: 请求成功后，并且通过业务逻辑检测（如果有的话）后会执行参数传入的回调函数

params: @callback(function) 回调函数，参数为返回数据中指定key对应内容 @data(any)
        
**fail**

说明: 请求成功后，并且通过业务逻辑检测（如果有的话）后会执行参数传入的回调函数

params: @callback(function) 回调函数，参数为错误对象error


**finally**

说明: 无论请求成功或失败都会调用。适用于特定场景下变量锁

params: @callback(function) 回调函数，无参数


**promise**

说明: 调用函数后会将请求的promise对象返回。

> 警告： 调用此方法后无法继续链式调用

