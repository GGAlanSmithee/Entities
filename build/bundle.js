const fs      = require('fs')
const path    = require('path')
const babel   = require('rollup-plugin-babel')
const rollup  = require('rollup')
const resolve = require('rollup-plugin-node-resolve')

const polyfillPath = path.join(__dirname, '../node_modules/@babel/polyfill/dist/polyfill.js')
const polyfill = fs.readFileSync(polyfillPath, 'utf8')

const outputDir = 'dist'
const outputFile = 'gg-entities.js'

const inputOptions = {
    input: 'src/index.js',
    plugins: [
        babel({
            babelrc: false,
            presets: [['@babel/preset-env', { modules: false }]],
            exclude: 'node_modules/**',
        }),
        resolve()
    ],
}

const outputOptions = {
    dir: outputDir,
    file: outputFile,
    intro: `${polyfill}\n\n\n\n`,
    format: 'umd',
    name: 'GGEntities',
    sourcemap: 'inline',
}

const build = async () => {
    const bundle = await rollup.rollup(inputOptions)

    await bundle.write(outputOptions)
}
  
build()