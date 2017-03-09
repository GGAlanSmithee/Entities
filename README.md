# Entities

easy-to-use Entity-Component System for browser and node

## Usage

```javascript
import { EntityManager } from 'gg-entities'

const entityManager = new EntityManager()

// Create components

const pos = entityManager.registerComponent('position', {
    x : 10.0,
    y : 10.0
})

const vel = entityManager.registerComponent('velocity', 2.0)

// Add a system for the created components

function movementSystem(entities, { delta }) => {
    for (let {entity} of entities) {
        entity[pos].x += entity[vel] * delta
    }
}

entityManager.registerLogicSystem('movement', [ pos, vel ], movementSystem)

// Run the systems

...

let delta = 0.16

entityManager.onLogic({delta})
entityManager.onRender({delta})

...
```

*See /examples for more usages*

## Documentation

* EntityManager
* EntityFactory
* SystemManager
* ComponentManager

## Features

* Easy to use
* Configurable
* 100% code coverage
* Fast [TODO: add benchmarks and comparisons to back this claim]

## Tips and tricks

* Using [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring) and [computed properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names)

Accessing an entity's components in a system usually looks like this

```javascript
function movementSystem(entities) => {
    for (const { entity } of entities) {
        entity[POS_COMPONENT].x += entity[VEL_COMPONENT].x * delta
        entity[POS_COMPONENT].y += entity[VEL_COMPONENT].y * delta
    }
}
```

which can be a bit ugly. Especially if your entity has a lot of components and the are accessed multiple times.
Using some es6 magic, we can make it look a bit better though;

```javascript
function movementSystem(entities) => {
    for (const { entity: { [POS_COMPONENT]: pos, [VEL_COMPONENT]: vel } } of entities) {
        pos.x += vel.x * delta
        pos.y += vel.y * delta
    }
}
```

## FAQ / Gotchas

* Since a system is bound with the `EntityManager` as its context, a system must be a regular function (not a es6 arrow function)

## Contributing / Building

- **download [nodejs][2]** and install

- **fork the repository** and clone it on your local computer

- **install dependencies** by running `npm i` in the repository folder

- **make changes** 

- **run the build script** by typing `npm run build` in the console, eventually genenrating the file `dist/entities.js`

- **add tests** for the added functionality in `/test` and run `npm run test`

- **send a pull request** to the dev branch with an explanation of what it is that you have been done

- **thanks!!** for contributing

[0]: https://github.com/babel/babel
[1]: https://babeljs.io/docs/usage/polyfill/
[2]: http://nodejs.org
