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
* Well tessted with 100% code coverage
* Well documented
* Typescript typings included
* No external dependencies
* Built with modern JavaScript
* Small [TODO: is this relatively true?]
* Fast [TODO: add benchmarks and comparisons to back this claim]

## Examples

* [boxes](http://ggalansmithee.github.io/Entities/examples/boxes.html)
* [options](http://ggalansmithee.github.io/Entities/examples/opts.html)
* [using custom entity data](http://ggalansmithee.github.io/Entities/examples/with-data.html)
  
## Docs

http://ggalansmithee.github.io/Entities/

## Typings

The library includes typescript typings for 100% of the public API.

## Get involved

* Got questions or want to leave feedback? [create an issue](https://github.com/GGAlanSmithee/Entities/issues/new)

* Got improvements? Feel free to send a PR to the `dev` branch (don't forget to add tests)
    1. `npm run build` *builds the project*
    2. `npm run test` *runs the test suite*