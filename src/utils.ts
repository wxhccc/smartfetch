const { hasOwnProperty, toString } = Object.prototype

export const has = (val: unknown, key: string) => hasOwnProperty.call(val, key)

export const objType = (val: unknown) => {
  const typeKeys = toString.call(val).match(/^\[object (.*)\]$/)
  return typeKeys ? typeKeys[1] : ''
}