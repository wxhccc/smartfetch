module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
    node: true
  },
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ]
}
