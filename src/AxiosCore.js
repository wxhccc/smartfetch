export default function AxiosCore () {
  this._request = function (config) {
    return this.core(config)
      .then(this._resStatusCheck);
  }
  this._resStatusCheck = (response) => {
    this.__response = response
    return response.data;
  }
}