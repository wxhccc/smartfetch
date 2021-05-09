module.exports = {
  presets: ['@babel/env'],
  plugins: [],
  exclude: 'node_module/**',
  env: {
    test: {
      presets: [
        ['@babel/env', { targets: { node: true } }],
        ['@babel/preset-react']
      ]
    }
  }
}
