var fs        = require( 'fs' );
var esperanto = require( 'esperanto' );

esperanto.bundle({
    base: 'src',
    entry: 'entities'
}).then( function ( bundle ) {
    var cjs = bundle.toCjs({ strict: true });
    fs.writeFile('build/entities.js', cjs.code);
});