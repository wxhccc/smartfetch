import SmartApi from './SmartApi'
export default class SmartApiVue extends SmartApi {
  _useSAkeys = false;
  constructor (ajaxCore, context, config) {
    super(ajaxCore, context);
    this._createRequest(config);
    return this;
  }
  _stateLock (unlock) {
    let {_lockKey, _context, _context: {SAKEYS}} = this;
    if (_context.hasOwnProperty(_lockKey)) {
      _context[_lockKey] = !unlock;
    } else {
      if (SAKEYS.hasOwnProperty(_lockKey)) {
        SAKEYS[_lockKey] = !unlock;
      } else {
        _context.$set(SAKEYS, _lockKey, true);
        this._useSAkeys = true;
      }
    }
  }
  _getLockValue () {
    let {_context, _lockKey, _useSAkeys} = this;
    return _useSAkeys ? _context.SAKEYS[_lockKey] : _context[_lockKey];
  }
}