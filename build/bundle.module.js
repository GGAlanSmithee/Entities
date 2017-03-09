const rollup = require('rollup')
const babel  = require('rollup-plugin-babel')

rollup.rollup({
    entry: 'src/index.js',
    plugins: [
        babel({
            babelrc: false,
            plugins: ['transform-object-rest-spread'],
            exclude: 'node_modules/**'
        })
    ]
}).then(bundle => {
    bundle.write({
        dest: 'dist/gg-entities.module.js',
        sourceMap: 'inline',
        format: 'umd',
        moduleId: 'GGEntities',
        moduleName: 'GGEntities'
    })
}).catch(error => {
    console.error(error)
})
