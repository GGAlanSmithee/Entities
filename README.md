# Entities
easy-to-use Entity-Component System in JavaScript

## This library is built using [babel][0] and it uses generators. To use it you must `require` or `include` the [polyfill][1] first

## Usage

```javascript
var Entities = require('entities');

var entityManager = new Entities.EntityManager();

// Create components
var position = entityManager.registerComponent({
    x : 10.0,
    y : 10.0
});

var velocity = entityManager.registerComponent(2.0);

// Add a system for the created components
var movementSystem = function(entities, delta) {
    for (var entity of entities) {
        var pos = this[position][entity];
        var vel = this[velocity][entity];

        pos.x += vel * delta;
    }
};

entityManager.registerSystem(movementSystem, position | velocity, Entities.SystemType.Logic);

// Run the systems
...

var delta = 0.16;

entityManager.onLogic(delta);
entityManager.onRender(delta);

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
