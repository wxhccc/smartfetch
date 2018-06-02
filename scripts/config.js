const cjs = require('rollup-plugin-commonjs')
const node = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')

const outputs = {
  production: {
    format: 'cjs',
    file: 'dist/smartapi.common.js',
  }
};
function genConfig (env) {
  return {
    input: 'src/index.js',
    output: Object.assign({}, {
      file: 'dist/smartapi.js',
      name: 'Smartapi',
      format: 'umd'
    }, outputs[env]),
    plugins: [ 
      node({
        customResolveOptions: {
          moduleDirectory: 'node_modules'
        }
      }),
      babel({
        runtimeHelpers: true,
        exclude: 'node_modules/**' // 只编译我们的源代码
      }),
      cjs()
    ].concat(env === 'production' ? uglify() : []),
    external: ['axios'],
    watch: {
      include: 'src/**'
    }
  }
}

export default genConfig(process.env.NODE_ENV)