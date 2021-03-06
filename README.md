# GG-Entities

easy-to-use Entity-Component System for browsers and Node.js

## Usage

```javascript
import { EntityManager } from 'gg-entities'

const entityManager = new EntityManager()

// 1. Register Components

const pos = entityManager.registerComponent('position', {
    x : 10.0,
    y : 10.0
})

const vel = entityManager.registerComponent('velocity', 2.0)

// 2. Register Systems

function movementSystem(entities, { delta }) {
    for (const {entity} of entities) {
        entity[pos].x += entity[vel] * delta
    }
}

entityManager.registerLogicSystem([ pos, vel ], movementSystem)

function logSystem(entities) {
    for (const {entity} of entities) {
        console.log(entity[pos].x, entity[pos].y)
    }
}

entityManager.registerRenderSystem([ pos ], logSystem)

// 3. Add an entity

entityManager
    .build()
    .withComponent(pos)
    .withComponent(vel)
    .create(1)

// 4. Run the systems

entityManager.onLogic({ delta: 16 })  // invokes all logic systems (movementSystem)
entityManager.onRender({ delta: 16 }) // invokes all render systems (logSystem)
```

## Features

* Easy to use
* Configurable
* 100% code coverage
* Fast [TODO: add benchmarks and comparisons to back this claim]

## Examples

* [boxes](http://ggalansmithee.github.io/Entities/examples/boxes.html)
* [options](http://ggalansmithee.github.io/Entities/examples/opts.html)

## Docs

http://ggalansmithee.github.io/Entities/

## Typings

There are no official typings (yet), but @ForsakenHarmony has provided a [gist](https://gist.github.com/ForsakenHarmony/33ef7c4d7cba7a08d5fa2667b5b1b31e) for TypeScript users.

## FAQ / Gotchas

* Since a system is bound with the `EntityManager` as its context, a system must be a regular function (not an es6 arrow function)

## Tips and tricks

* Using [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring) and [computed properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names)

Accessing an entity's components in a system usually looks like this

```javascript
function movementSystem(entities) {
    for (const { entity } of entities) {
        entity[POS_COMPONENT].x += entity[VEL_COMPONENT].x * delta
        entity[POS_COMPONENT].y += entity[VEL_COMPONENT].y * delta
    }
}
```

which can be a bit ugly, especially if your entity has a lot of components which are accessed multiple times. Using some ES6 (computed property keys) and ES7 (object spread) magic, we can make it a bit more concise:

```javascript
function movementSystem(entities) {
    for (const { entity: { [POS_COMPONENT]: pos, [VEL_COMPONENT]: vel } } of entities) {
        pos.x += vel.x * delta
        pos.y += vel.y * delta
    }
}
```

## Get involved

* Got questions or want to leave feedback? [create an issue](https://github.com/GGAlanSmithee/Entities/issues/new)

* Got improvements? Feel free to send a PR to the `dev` branch (don't forget to add tests)
    1. `npm run build` *builds the project*
    2. `npm run test` *runs the test suite*