import SmartApi from './SmartApi'

const { hasOwnProperty } = Object.prototype

export default class SmartApiVue extends SmartApi {
  _useSAkeys = false;
  constructor (ajaxCore, context, config, isInstance) {
    super(ajaxCore, context, config, isInstance);
    return this;
  }
  _checkOrSetVueSAkeys () {
    const { _context, _lockKey, _isInstance } = this;
    this._useSAkeys = !hasOwnProperty.call(_context, _lockKey[0]);
    if (_isInstance && this._useSAkeys) {
      !hasOwnProperty.call(_context, 'SF_KEYS') && _context.$set('SF_KEYS', {})
      this._contextState = _context['SF_KEYS']
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