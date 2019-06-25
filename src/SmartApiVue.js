import SmartApi from './SmartApi'

const { hasOwnProperty } = Object.prototype

export default class SmartApiVue extends SmartApi {
  _useSAkeys = false;
  constructor (ajaxCore, context, config) {
    super(ajaxCore, context, config, null);
    return this;
  }
  _checkOrSetVueSAkeys () {
    const { context, _lockKey } = this;
    this._useSAkeys = !hasOwnProperty.call(context, _lockKey[0]);
    if (this._useSAkeys) {
      !hasOwnProperty.call(context, 'SAKEYS') && context.$set('SAKEYS', {})
      this._contextState = context['SAKEYS']
    }
  }
  _setValue (obj, path, value) {
    const { $set } = this._context;
    let curObj = obj;
    for(let i = 0; i < path.length; i++) {
      const key = path[i];
      const hasKey = hasOwnProperty.call(curObj, key)
      const isObj = hasKey && typeof curObj[key] === 'object' && curObj[key]
      if (i === path.length - 1) {
        hasKey ? (!isObj && (curObj[key] = value)) : $set(curObj, key, value)
      } else {
        !hasKey && $set(curObj, key, {})
      }
      curObj = curObj[key]
      if (typeof curObj !== 'object') {
        break;
      }
    }
  }
}