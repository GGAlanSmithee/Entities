## v1.1.0 (2016-04-08)

### Feature

Added the ability to pass in an aditional parameter `opts` to the `onRender` and `onLogic` methods of the `entityManager`. This parameter will be passed as the last argument to the registered logic and render systems that is invoked.

## v1.0.4 (2015-10-03)

### ES6 compatability

Updated `export` statement to properly handle named exports

## v1.0.3 (2015-08-27)

### Build configuration

Exchanged [esperanto](https://github.com/esperantojs/esperanto) in favor of [rollup](https://github.com/rollup/rollup)

## v1.0.2 (2015-08-23)

### Build configuration

Added `jsnext:main` to `package.json` to allow for bundlers such as [rollup](https://github.com/rollup/rollup) to take advantage of es6 modules through techniques such as tree shaking

## v1.0.1 (2015-08-08)

### Build configuration

Added ugily / minify step to create minified build

## v1.0.0 (2015-08-07)

### Initial Release

Added base functionality