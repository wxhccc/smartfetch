import SmartApi from './SmartApi'
const { hasOwnProperty } = Object.prototype

export default class SmartApiVue extends SmartApi {
  _useSAkeys = false;
  constructor (ajaxCore, context, config) {
    super(ajaxCore, context);
    this._createRequest(config);
    return this;
  }
  _setValue (obj, path, value) {
    const { SAKEYS } = obj;
    const { $set } = this._context
    this._useSAkeys = !hasOwnProperty.call(obj, path[0])
    let curObj = this._useSAkeys ? SAKEYS : obj;
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