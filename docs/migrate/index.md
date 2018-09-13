# Migrating

## Migrating from v2 to v3

### COMPLETE INTERNAL REWRITE, MAJOR PUBLIC API CHANGES, DOCS COMMING SOON !

## Migrating from v1 to v2

Version 2 has seen a lot of internal and external changes, but reading through these points, upgrading should be pretty straight-forward. The code is built to fail in such a way that it should be appearant what action you as a user need to take to fix it. If you find this to not be the case, please let me know!

### Registering a component

* v1

```javascript
    const comp = entityManager.registerComponent(1)
```

* v2

```javascript
    const comp = entityManager.registerComponent('comp', 1)
```

### Registering a system

* v1

```javascript
    const sys = entityManager.registerLogicSystem(Entities.SelectorType.GetWith, comp1 | comp2, system)
```

* v2

```javascript
    const sys = entityManager.registerLogicSystem([ compName1, compName2 ], system)

    // or

    const sys = entityManager.registerLogicSystem(compId1 | compId2, system)
```

### Accessing an entity's components from within a system

* v1

```javascript
    function logSystem(entities) {
        for (var entity of entities) {
            console.log(this[position][entity].x, this[position][entity].y)
        }
    }
```

* v2

```javascript
    function logSystem(entities) => {
        for (const {entity, i} of entities) {
            console.log(i, entity[pos].x, entity[pos].y)
        }
    }
```