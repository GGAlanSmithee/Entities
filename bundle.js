var fs = require( 'fs' );
var esperanto = require( 'esperanto' );

esperanto.bundle({
  base: 'src', // optional, defaults to current dir
  entry: 'Entities' // the '.js' is optional
}).then( function ( bundle ) {
  var cjs = bundle.toCjs({ strict: true });
  fs.writeFile( 'dist/es6.js', cjs.code );
});