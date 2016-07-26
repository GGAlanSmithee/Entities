const fs     = require('fs')
const path   = require('path')
const rollup = require('rollup')
const babel  = require('rollup-plugin-babel')

rollup.rollup({
    entry: 'src/index.js',
    plugins: [
        babel({
            babelrc: false,
            presets: [ 'es2015-rollup' ],
            exclude: 'node_modules/**'
        })
    ]
}).then(bundle => bundle.write({
    dest: 'dist/gg-entities.es5.js',
    sourceMap: 'inline',
    format: 'umd',
    moduleId: 'GGEntities',
    moduleName: 'GGEntities'
})).then((c) => {
    const entitiesPath = path.join(__dirname, '../dist/gg-entities.es5.js')
    
    const polyfill = fs.readFileSync(path.join(__dirname, '../node_modules/babel-polyfill/dist/polyfill.js'), 'utf8')
    const entities = fs.readFileSync(entitiesPath, 'utf8')
    
    fs.writeFile(entitiesPath, `${polyfill}\n\n${entities}`, error => {
        if (error) {
            console.error(error)
        }      
    })
}).catch(error => {
    console.error(error)
})