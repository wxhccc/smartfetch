import resolve from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

function createConfig(config, plugins) {
  const nodePlugin = [resolve(), commonjs()];
  const tsPlugin = typescript({
    emitDeclarationOnly: false
  });

  const output = Object.assign(
    {
      globals: {
        axios: 'axios'
      },
    },
    "output" in config ? config.output : {}
  );
  return Object.assign(
    {
      input: "src/index.ts",
    },
    config,
    {
      output,
      external: ['axios'],
      plugins: [nodePlugin, tsPlugin].concat(plugins),
    }
  );
}

function getConfig(env) {
  const babelPlugin = babel({
    babelHelpers: 'bundled',
    exclude: "node_modules/**", // 只编译我们的源代码
  });
  const cjsCfg = createConfig(
    {
      output: {
        file: pkg.main,
        format: "cjs",
        exports: "named",
      },
      watch: {
        include: "src/**",
      },
    },
    [babelPlugin]
  );
  const esCfg = createConfig({
    output: {
      file: pkg.module,
      format: "es",
    },
  });
  const umdMinCfg = createConfig(
    {
      output: {
        file: pkg.unpkg,
        name: "Smartfetch",
        format: "umd",
        exports: "named",
      },
    },
    [babelPlugin, terser()]
  );
  return env === "development" ? esCfg : [cjsCfg, esCfg, umdMinCfg];
}

export default getConfig(process.env.NODE_ENV);


// import commonjs from '@rollup/plugin-commonjs'
// import resolve from '@rollup/plugin-node-resolve'
// import babel from '@rollup/plugin-babel'
// import { terser } from 'rollup-plugin-terser'


// const mergeCfg = (output, plugins=[], others, containQs) => ({
//   input: 'src/index.js',
//   output: {
//     name: 'Smartfetch',
//     exports: 'named',
//     globals: { axios: 'axios' },
//     ...output
//   },
//   plugins: [babelPlugin, commonjs(), nodePlugin].concat(plugins),
//   external: ['axios'].concat(containQs ? [] : ['qs']),
//   ...others
// })

// function getConfig (env) {
//   const cjsCfg = mergeCfg(
//     {
//       file: 'lib/smartfetch.common.js',
//       format: 'cjs'
//     }, [], {
//       watch: {
//         include: 'src/**'
//       }
//     }
//   )
//   const esCfg = mergeCfg({ file: 'lib/smartfetch.esm.js', format: 'es' })
//   const umdMinCfg = mergeCfg({ file: 'lib/index.js', format: 'umd' }, [terser()], {}, true)
//   return env === 'development' ? cjsCfg : [cjsCfg, esCfg, umdMinCfg]
// }
