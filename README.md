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

const movementSystem = (entities, { delta }) => {
    for (let entity of entities) {
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
