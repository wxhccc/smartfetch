# smartapi
an easy use api plugin for vue and react.

# Installing

use npm 
```
$ npm install smartapi
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
  baseConfig: {  //baseConfig for all request
    baseURL: ''
  },
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
use the component 
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


