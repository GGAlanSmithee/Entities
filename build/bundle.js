var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var commonjs = require('rollup-plugin-commonjs');

rollup.rollup({
    entry: 'src/gg-entities.js',
    plugins: [
        babel({
            babelrc: false,
            presets: [ 'es2015-rollup'],
            exclude: 'node_modules/**'
        })
    ]
}).then(function(bundle) {
    bundle.write({
        dest: 'dist/gg-entities.js',
        //sourceMap: 'inline',
        format: 'umd',
        moduleId: 'GGEntities',
        moduleName: 'GGEntities'
    });
}).catch(function(error) {
    console.warn(error);
});