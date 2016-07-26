const rollup = require('rollup')

rollup.rollup({
    entry: 'src/index.js'
}).then(bundle => {
    bundle.write({
        dest: 'dist/gg-entities.js',
        sourceMap: 'inline',
        format: 'umd',
        moduleId: 'GGEntities',
        moduleName: 'GGEntities'
    })
}).catch(error => {
    console.error(error)
})