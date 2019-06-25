import SmartApi from './SmartApi';

export default class SmartApiReact extends SmartApi {
  constructor (ajaxCore, context, config) {
    super(ajaxCore, context, config, 'state');
    return this;
  }
  _setValue (obj, path, value) {
    super._setValue(obj, path, value)
    this._context.setState({ [path[0]]: this._contextState[path[0]] })
  }
}
