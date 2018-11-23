# Tips and tricks

## Using [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring) and [computed properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names)

Accessing an entity's components in a system usually looks like this

```javascript
function movementSystem(entities) {
    for (const entity of entities) {
        entity[POS_COMPONENT].x += entity[VEL_COMPONENT].x * delta
        entity[POS_COMPONENT].y += entity[VEL_COMPONENT].y * delta
    }
}
```

which can be a bit ugly, especially if your entity has a lot of components which are accessed multiple times. Using some ES6 (computed property keys) and ES7 (object spread) magic, we can make it a bit more concise:

```javascript
function movementSystem(entities) {
    for (const { [POS_COMPONENT]: pos, [VEL_COMPONENT]: vel } of entities) {
        pos.x += vel.x * delta
        pos.y += vel.y * delta
    }
}
```
