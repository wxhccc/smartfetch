import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

const nodePlugin = resolve({
  customResolveOptions: {
    moduleDirectory: 'node_modules'
  }
})
const babelPlugin = babel({
  exclude: 'node_modules/**' // 只编译我们的源代码
})
const mergeCfg = (output, plugins=[], others, containQs) => ({
  input: 'src/index.js',
  output: {
    name: 'Smartfetch',
    exports: 'named',
    globals: { axios: 'axios' },
    ...output
  },
  plugins: [babelPlugin, commonjs(), nodePlugin].concat(plugins),
  external: ['axios'].concat(containQs ? [] : ['qs']),
  ...others
})

function getConfig (env) {
  const cjsCfg = mergeCfg(
    {
      file: 'lib/smartfetch.common.js',
      format: 'cjs'
    }, [], {
      watch: {
        include: 'src/**'
      }
    }
  )
  const esCfg = mergeCfg({ file: 'lib/smartfetch.esm.js', format: 'es' })
  const umdMinCfg = mergeCfg({ file: 'lib/index.js', format: 'umd' }, [uglify()], {}, true)
  return env === 'development' ? cjsCfg : [cjsCfg, esCfg, umdMinCfg]
}
export default getConfig(process.env.NODE_ENV)