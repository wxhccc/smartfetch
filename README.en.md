# smartfetch
an easy use api plugin for vue and react.

# Installing

use npm 
```
$ npm install smartfetch
```

# Example

use in vuejs

install the plugin in main.js

```
import Vue from 'vue'
...
import smartfetch from 'smartfetch'

/** those code can be import from config file **/

import { Notification } from 'element-ui';  // you can use the ui component you like
const statusMsgs = {
  '404': '请求地址不存在',
  '500': '服务器维护中，请稍后再试'
};
const codeMsgs = {
  'E001': '未登录'
};
const useConfig = {
  baseConfig: {  //baseConfig for all request ,can be an array to set multiple
    baseURL: ''
  },
  /*baseConfig: [  // key is necessary to switch
    {
      key: 'default',  // 'default' will be the default baseConfig set
      baseURL: 'url1'
    },
    {
      key: 'upload'
      baseURL: 'url2'
    }
  ]*/
  baseData: {},  // the data will append to all request, accept an object or a function
  errorHandle: notifyMsg, // the http error handler
  statusWarn: statusMsgs, // status warning text map
  resCheck: 'success', // the api success check key, can be a function
  forceAxios: true, // force to use axios to request, default fetch 
  dataKey: 'data',  // the api data key, default 'data'
  codeError: (resjson) => { /* the web system error code handler, you can use api error message or use code switch to message you want */ 
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
	  	  .lock('loading')  // lock the loading before request send and unlock when response back
	  	  .done((data) => { /* if the request is success and has no system error, this will run with back data */
	  	  	// todo
	  	  })
	  	  .silence() /* if you api have not deploy on server, you can use silence mode to prevent warn, in this way you can get some functionality online ahead of time  ,when api is ok, data will back. */
	  	  .faile((error)=>{

	  	  }) /* if you want do something when error generated, you can use this method */
	  	  .notCheckCode() /* if you use this plugin to get some data from others api, and the have different format api, you can use this method, when response back will send to done immediate */
	}
...
```

# API document

## options

**baseConfig**: the config will work on all request. you can set *baseURL* and *headers* by use this item. receive object or array

*for example：*
```
// use object
baseConfig: {
  baseURL: 'http://a.b.com',
  headers: {x-token: 'xxxxxxx'}
}
/* use array, this key in array items is necessary. 
** *default* is special, the item with default will be the default config
** you can use the **useCore(key)** method to change config when you want to send a request
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
ps: if you want to modify baseConfig after plugin init, you can use "modifyBaseConfigs" method

**baseData**: the data will merge to all request peyload, receive object or function

*for example：*
```
// use object
baseData: {
  token: 'xxxxxxxxxxx',
}
// use function

baseData: () => {
  const token = Math.random();
  return {
    token
  }
}
```
**errorHandle**: the handle method for http request error, usually use ui message component to show the error message

*for example：*
```
errorHandle: (msg, error) => {
  alert(msg)
  // you can handle the *error* yourself
}
```

**statusWarn**: the http status code message map, you can use this to show different tips of status such as *404*, *500*

*for example：*
```
statusWarn: {
  '401': 'xxxx',
  '402': 'xxxxxxx'
  ....
}
```

**resCheck**: the method to check whether operation success , receive string or function

*for example：*
```
// use string, will check response[resCheck] is *true*
resCheck: 'success'

// use function
resCheck: (response) => {
  return response.code === 200
}
```

**dataKey**: decide which key will be used to get data when operation success, receive string, default *data*

**forceAxios**: force to use axios to request, default use *fetch* to send it fetch can work

**codeError**: the method to handle operation faile , receive function

*for example：*
```
codeError: (resJson) => {
  // to do
}
```
## request

you can import this method from smartfetch, the method will make you request more easier

how to use
```
//// example 1:
const args = request('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)

//// example 2:
// you can get a url link for download
const linkUrl = request('api/getxxx', {a: 1, b: 2}, 'GET', true)
// linkUrl: http://a.b.com/api/getxxx?a=1&b=2

//// example 3:
// if the first argument is object, the method will return a function, you can use the object to switch the baseconfig
const args = request({useCore: 'upload'})('api/getxxx', {a: 1, b: 2}, 'GET')
this.$fetch(args)
// request url will use upload baseconfig, such as 'http://a.bcd.com/api/getxxx'

```

## fetch
how to use
**use class name**
```
import {SmartFetch} from 'smartfetch'

const options = {
  // configs
}
const smartfetch = SmartFetch(options)

```
**in vuejs**
use Vue.use in main
```
...
import smartfetch from 'smartfetch'
const options = {
  // configs
}
Vue.use(smartfetch, options)

this.$fetch
...
```

### methods
 list the methods of instance of SmartFetch
**resetOpts**
explain: you can use this method to reset options


**fetch**
explain: you can use this method to send a request, the request will send after all sync methods (such as lock) running

how to use
```
//// example 1:
// if the first argument is object
const args = {
  url: 'api/getxxx',
  data: {a: 1, b: 2},
  method: 'POST')
}
this.$fetch(args)
// or
smartfetch.fetch(args)

//// example 2:
// if the first argument is a string , fetch will use *request* to handle arguments
this.$fetch('api/getxxx', {a: 1, b: 2}, 'GET')

//// example 3:
// if the first argument is a function , fetch will put rest arguments to the function, can use with request to make apis more clear
const request1 = function(data) {
  return request('api/getxxx', data, 'GET')
}
this.$fetch(request1, {a: 1, b: 2})


```
**modifyBaseConfigs**
explain: you can use this method to modify "baseConfig" when you need

how to use
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

#### list the methods of the return of fetch function

**lock**

explain: you can use this method to lock a state/data variable before request send and unlock after response back


how to use
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

params: @key(string): baseconfig key

explain: you can use this method to switch baseconfig

**silence**

explain: you can use this method to shut down all error handle functions

**done**

params: @data(any): data

explain: you can use this method to handle data when operation success

**notCheckCode**

explain: you can use this method to shut down all check process, when you request thirdparty api you can use this , all response object will pass to done function 