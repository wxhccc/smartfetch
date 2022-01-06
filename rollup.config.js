import resolve from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) ${new Date().getFullYear()} wxhccc
  * @license MIT
  */`

let tsChecked = true

function createConfig(config, plugins = [], input, tsOptions) {
  const tsOpts = tsOptions || {
    tsconfigOverride: {
      declaration: tsChecked,
      emitDeclarationOnly: false
    },
    useTsconfigDeclarationDir: true
  }
  const tsPlugin = typescript(tsOpts)

  tsChecked && (tsChecked = false)
  return {
    input: input || 'src/index.ts',
    external: ['axios', 'vue'],
    ...config,
    output: Array.isArray(config.output)
      ? config.output.map((cfg) => Object.assign(cfg, { banner }))
      : {
          ...config.output,
          banner
        },
    plugins: [resolve(), commonjs(), tsPlugin].concat(plugins)
  }
}

function getConfig(env) {
  const babelPlugin = babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**'
  })
  const esCfg = createConfig({
    output: {
      file: pkg.module,
      format: 'es'
    }
  })
  const cjsCfg = createConfig(
    {
      output: {
        file: pkg.main,
        format: 'cjs',
        exports: 'named'
      },
      watch: {
        include: 'src/**'
      }
    },
    [babelPlugin]
  )

  const vuePluginCfg = createConfig(
    {
      input: 'src/vue-plugin.ts',
      external: ['axios', 'vue', './index'],
      output: [
        {
          file: 'dist/vue-plugin.js',
          format: 'es',
          exports: 'named'
        },
        {
          file: 'dist/vue-plugin.cjs.js',
          format: 'cjs',
          exports: 'named'
        }
      ]
    },
    [babelPlugin]
  )

  if (env === 'development') return [esCfg, cjsCfg, vuePluginCfg]

  const umdMinCfg = createConfig(
    {
      output: {
        file: pkg.unpkg,
        name: 'Smartfetch',
        format: 'umd',
        exports: 'named'
      }
    },
    [babelPlugin, terser()]
  )
  return [cjsCfg, esCfg, vuePluginCfg, umdMinCfg]
}

export default getConfig(process.env.NODE_ENV)
