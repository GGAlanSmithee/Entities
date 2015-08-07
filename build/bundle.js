var fs        = require( 'fs' );
var esperanto = require( 'esperanto' );

esperanto.bundle({
    base: 'src',
    entry: 'gg-entities'
}).then( function ( bundle ) {
    var cjs = bundle.toCjs({ strict: true });
    fs.writeFile('build/gg-entities.js', cjs.code);
});