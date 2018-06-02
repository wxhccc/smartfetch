export default function AxiosCore () {
  this._request = function (config) {
    return this.core(config)
      .then(this._resCheck);
  }
  this._resCheck = function (response) {
    if (response.status === 200) {
      return response.data;
    }
    throw new Error(response.status);
  }
}