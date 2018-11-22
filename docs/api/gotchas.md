# Gotchas

## always use the public API for adding/removing components from an entity

*Since there are internal structures which needs to be updated accordingly, alternating entities from the outside in this manner could potentially cause wrong behaviours.*

## always use the public API for creating/deleting a entity

See above.

## always use a `bind`-able function when registering a system

Since the system is bound with the EntityManager as its context, using a lexically bound function (`() => { ... }`) will not work as intended.

## component initializers must be a function which returns the new component value

```js
// OK !
entityManager
    .build()
    .withComponent('testComp', () => new TestComponen(1, 'some value', true))
    .withComponent('valueComp', () => 42)
    .create(10)

// Not OK !
entityManager
    .build()
    .withComponent('testComp', new TestComponen(1, 'some value', true)) // initializer must be a function
    .withComponent('valueComp', 42) // initializer must be a function
    .create(10)
```