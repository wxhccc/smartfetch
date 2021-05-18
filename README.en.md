# smartfetch

Based on the fetch and axios encapsulate common interface processing plug-in, can handle very generic interface usage, provide different domain based address switching capacity

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

> use in vue2

install the plugin in main.js

```
import Vue from 'vue'
...
import smartfetch from '@wxhccc/smartfetch'

/** The configuration is recommended to write in a file **/

import { Notification } from 'element-ui';  // you can use other UI library
const statusMsgs = {
  '404': 'URL not find',
  '500': 'Server maintenance, please try again later'
};
const codeMsgs = {
  'E001': 'No login'
};
const useConfig = {
  baseConfigs: {
    baseURL: ''
  },
  /*baseConfigs: [  // key is required when muilt configs
    {
      key: 'default',  // 'default' is default key
      baseURL: 'url1'
    },
    {
      key: 'upload'
      baseURL: 'url2'
    }
  ]*/
  baseData: {}, 
  errorHandler: notifyMsg,
  statusWarn: statusMsgs,
  responseCheck: 'success',
  forceAxios: true,
  dataKey: 'data',
  codeErrorHandler: (resjson) => {
    let {errorCode, errorMsg} = resjson;
    let msg = errorMsg || 'request fail';
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

> use in vue3

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
	  	  .lock('loading') 
	  	  .done((data) => { 
	  	  	// todo
	  	  })
	  	  .silence() 
	  	  .faile((error)=>{
         
	  	  }) 
	  	  .notCheckCode()
        .finally(() => {
        })
	}
...
```

> use in react


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
    state may update async，lock can't stop repeat send。
  */
  const locking = useRef(false)
  const getDataListLock = () => {
    this.$fetch({url: 'api/test', data: {user: 'aaa'}})
	  	  .lock(setLoading, [locking, 'value'])
  }
...
```

# API document

## options

**baseConfigs**:


```

baseConfigs: {
  baseURL: 'http://a.b.com',
  headers: {x-token: 'xxxxxxx'}
}
or
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


**baseData**: 


```

baseData: {
  token: 'xxxxxxxxxxx',
}

or

baseData: () => {
  const token = Math.random();
  return {
    token
  }
}
```
**errorHandler**: 

*params：*

* @message(string)
* @error(Error)：
* @response(HTTP response): 

```
errorHandler: (msg, error) => {
  alert(msg)
  /* or 
  Notification.error({
    title: 'System Info',
    message: msg
  })
  */
}
```

**statusWarn**: 

```
statusWarn: {
  '401': 'No Auth',
  '404': 'Not found'
  ....
}
```

**responseCheck**: if you api is like `{ success: true, code: 200, message: '', data: {} }`。you can use `success` to check api is success

*示例：*
```
// when use string, will check responseData[resCheck]
responseCheck: 'success'


resCheck: (responseData) => {
  return responseData.code === 200
}
```

**dataKey**: default `data`

**forceAxios**: default `false`

**codeErrorHandler**: 

```
codeErrorHandler: (resJson) => {
  // to do
}
```
## request

* @url(string)
* @data(object/FormData)
* @method(string)
* @returnLinkOrExtra(boolean | object)
  * @useCore(string) switch core
  * @enctype(string) json = 'application/json', urlencode: 'application/x-www-form-urlencoded', text: 'text/plain'，default `json`  

## request(config)
Configuration of higher-order functions is used to set the request，return request method

* @config(object) 
  * useCore: 

how to use
```
import { request } from '@wxhccc/smartfetch'
//// eg. 1:

const args = request('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)

//// eg. 2:
// return link
const linkUrl = request('api/getxxx', {a: 1, b: 2}, 'GET', true)
// linkUrl: http://a.b.com/api/getxxx?a=1&b=2

//// eg. 3:

const args = request('api/getxxx', {a: 1, b: 2}, 'GET', { useCore: 'upload' })
this.$fetch(args)


```

### Recommon Mode

define method in files
```
import { request } from '@wxhccc/smartfetch'

export function getUserList (data) {
  return request('api/users', data)
}
export function addUser (data) {
  return request('api/users', data, 'PUT')
}
```

```
...
import { getUserList } from '@/api/xxxx'
...

this.$fetch(getUserList({ xxx: 'xxx' })).lock('loading').done(data => {
  // to do
})

```


## fetch

how to use

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

### smartfetch
methods of smartfetch

**resetOpts**

**fetch**

how to use
```
//// eg. 1:
// if the first argument is object
const args = {
  url: 'api/getxxx',
  data: {a: 1, b: 2},
  method: 'POST')
}
this.$fetch(args)
// or
smartfetch.fetch(args)

//// eg. 2:
// if the first argument is a string , fetch will use *request* to handle arguments
this.$fetch('api/getxxx', {a: 1, b: 2}, 'GET')


```
**modifyBaseConfigs**


how to use

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

## fetch


**lock**


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


params: @key(string): baseConfig key

```
  this.$fetch(arg).useCore('upload')
```

**silence**


**notCheckCode**


**done**

params: @callback(function) 
        
**faile**
params: @callback(function)


