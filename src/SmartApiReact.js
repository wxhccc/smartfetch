import SmartApi from './SmartApi';
export default class SmartApiReact extends SmartApi {
  constructor (ajaxCore, context) {
    super(ajaxCore, context);
    this._createRequest(url, data);
    return this;
  }
  _getLockValue () {
    let {_context, _lockKey} = this;
    return _context.state[_lockKey];
  }
  _stateLock (unlock) {
    let {_lockKey, _context} = this;
    setStateSync.call(_context, {[_lockKey]: !unlock});
  }
  _setValue (obj, path, value) {
    
  }
}

async function setStateSync (newState) {
  if(this.setState) {
    await new Promise(resolve => {
      this.setState(newState, resolve);
    })
  }
}