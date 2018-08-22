# Changelog

## v3.0.0-alpha.3 (2018-08-22)

## v3.0.0-alpha.2 (2018-08-10)

## v3.0.0-alpha.1 (2018-08-07)

Replaced all numeric ids for string keys (where possible)

## v2.4.0-beta.1 (2018-07-18)

Normalized the return value of `EntityManager.create(...)` and `EntityFactory.create(...)`, now always returns an array of entities, even if only one was created
Added `EntityManager.getEntity`
Added `EntityManager.hasComponent`
Added `isEntityManager` helper function to detect if variable is an instance of `EntityManager`
Added variable sanitation in many places

Added a per-system entity cache for improved performance

Exchanged `Mocha` + `Istanbul` to `Jest`
Fixed code coverage to 100%

Removed circular dependencies (do not include `EntityManager` in other files)

Added additional tests for edgecases
Updated and fixed examples
Updated documentation

Updated all dependencies and simplified build / bundle
Removed minified bundle, users will now have to handle this

Added `engines` in `package.json` - this is set to `>= 8.0.0`

## v2.3.0 (2018-05-31)

`EntityManager.newEntity` now properly registers a system using only the `components` array passed in

## v2.2.0 (2018-05-31)

`EntityManager.registerSystem` now properly registers a system using only the `components` array passed in

## v2.0.4 (2017-04-05)

Updated examples to be usable online

## v2.0.3 (2017-04-05)

Updated README.md with correct system registration

## v2.0.1 / v2.0.2 (2017-04-05)

Updated README.md links

## v2.0.0 (2017-04-05)

Updated README.md
Added MIGRATE.md
Added start of docs
Updated package.json

## v2.0.0-beta9 (2017-03-09)

Updated dependencies
Changed bundling to have `gg-entities.js` be es5 compatible
Added es6 module package `gg-entities.module.js`
Changed so that `jsnext:main` and `module` entries point to `gg-entities.module.js`
Updated README.md

## v2.0.0-beta8 (2016-08-29)

Reverts changes back to v2.0.0-beta4

## v2.0.0-beta7 (2016-08-22)

Removed support for unregistering components and initializers
Removed `EntityManager.unregisterComponent`
Removed `ComponentManager.unregisterComponent`
Removed `EntityFactory.unregisterInitializer`
Removed all usage of named components
Removed `name` parameter from `EntityManager.registerComponent`

## v2.0.0-beta4 / v2.0.0-beta5 / v2.0.0-beta6 (2016-08-03)

Added support for unregistering a component as well as a component initializer
Added `EntityManager.unregisterComponent`
Added `ComponentManager.unregisterComponent`
Added `EntityFactory.unregisterInitializer`

## v2.0.0-beta2 / v2.0.0-beta3 (2016-08-01)

Added support for getting / adding / removing a component by name (in addition to by id)
Added `name` parameter to `EntityManager.registerComponent`
`component` parameter of `EntityManager.addComponent` can now be either a string (name of component) or an id
`component` parameter of `EntityManager.removeComponent` can now be either a string (name of component) or an id
`components` parameter of `EntityManager.registerSystem` can now be either an array of strings (names of components) or an bitmask
`components` parameter of `EntityManager.registerInitSystem` can now be either an array of strings (names of components) or an bitmask
`components` parameter of `EntityManager.registerLogicSystem` can now be either an array of strings (names of components) or an bitmask
`components` parameter of `EntityManager.registerRenderSystem` can now be either an array of strings (names of components) or an bitmask
`component` parameter of `EntityManager.registerInitializer` can now be either a string (name of component) or an id
`component` parameter of `EntityManager.withComponent` can now be either a string (name of component) or an id

## v2.0.0-beta1 (2016-07-23)

Removed all default exports
Changed default dist file to be in es6
Moved the es5 compatible build to `dist/gg-entities.es5.js`
The es5 build now includes `babel-polyfill`
Moved promise related functions out of the `EventHandler` class (still in file as free functions)
Updated all npm dependencies to latest

## v2.0.0-alpha3 (2016-04-30)

Added `EntityManager.registerConfiguration(key)` 
Removed `EntityManager.createConfiguration()`

Registered configurations are now stored internally in the `EntityManager`
and can be used to create an entity by passing `key` to `EntityManager.create(key)`

## v2.0.0-alpha2.1 (2016-04-24)

Fixes `jsnext:main` to point to the correct location

## v2.0.0-alpha2 (2016-04-24)

Removed `delta` argument from `on(Init|Logic|Render)` in favor of passing delta as a part of `opts`
Removed `SelectorType`. The idea is that the user either specifies a list of components to select entities by them, or emits components to select all entities.
`EntityManager.Entities` is now a list of actual objects with a `components` property that is a list of the components that currently defines the entity.
The `components` of an `entity` is now a first class property of the acutal entity, instead of an array on the entity manager.

Exchanged `componentId` (int) argument with `key` (string) argument of `ComponentManager.newComponent`.
Added `key` (string) argument to `ComponentManager.registerComponent`.
`ComponentManager.registerComponent` now returns the `key` argument.

Exchanged `type` (`SelectorType`) argument with `key` (string) argument to `SystemManager.registerSystem`.
`components` argument of `SystemManager.registerSystem` is now an `Array<string>`, used to be an `int`.

Exchanged `componentId` (int) argument with `key` (string) argument of `EntityFactory.registerInitializer`.
Exchanged `componentId` (int) argument with `key` (string) argument of `EntityFactory.withComponent`.

`components` argument of `EntityManager.newEntity` is now an `Array<string>`, used to be an `int`.
`components` argument of `EntityManager.*getEntities` is now an `Array<string>`, used to be an `int`.
Removed `selector` argument from `EntityManager.*getEntities`.
Updated all proxy methods of `EntityManager` to match updates in respective manager class.

## v2.0.0-alpha1 (2016-04-09)

Added possibility to register init systems as well as added `onInit` method to the `EntityManager`

## v1.1.0 (2016-04-08)
Added the ability to pass in an aditional parameter `opts` to the `onRender` and `onLogic` methods of the `EntityManager`. This parameter will be passed as the last argument to the registered logic and render systems that is invoked.

Added `opts.html` example to show how to pass options to a system via `onRedner` and `onLogic`

## v1.0.4 (2015-10-03)
Updated `export` statement to properly handle named exports

## v1.0.3 (2015-08-27)

Exchanged [esperanto](https://github.com/esperantojs/esperanto) in favor of [rollup](https://github.com/rollup/rollup)

## v1.0.2 (2015-08-23)

Added `jsnext:main` to `package.json` to allow for bundlers such as [rollup](https://github.com/rollup/rollup) to take advantage of es6 modules through techniques such as tree shaking

## v1.0.1 (2015-08-08)

Added ugily / minify step to create minified build

## v1.0.0 (2015-08-07)

Added base functionality