import * as assert from 'assert'
import { SystemType, EntityManager } from 'gg-entities'

const Test = 'test'

class TestComponent {
    x = 100
    y = 100
}

assert.strictEqual(SystemType.Logic, 0)
assert.strictEqual(SystemType.Render, 1)
assert.strictEqual(SystemType.Init, 2)

const entityManager = new EntityManager(100)

assert.strictEqual(entityManager.capacity, 100)

entityManager.increaseCapacity()

assert.strictEqual(entityManager.capacity, 200)

entityManager.increaseCapacity()

assert.strictEqual(entityManager.capacity, 400)

entityManager.registerComponent(Test, TestComponent)

let entity = entityManager.newEntity([ Test ])

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 0)
    assert.deepStrictEqual(entity.components, [ Test ])

    entityManager.deleteEntity(entity.id)

    assert.deepStrictEqual(entity.components, [ ])
}

entity = entityManager.newEntity([ Test ])

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 0)
    assert.deepStrictEqual(entity.components, [ Test ])
}

entity = entityManager.newEntity([ Test ])

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 1)
    assert.deepStrictEqual(entity.components, [ Test ])
}

entity = entityManager.getEntity(1)

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 1)
    assert.deepStrictEqual(entity.components, [ Test ])
}

entity = entityManager.getEntity(399)

assert.notStrictEqual(entity, null)

entity = entityManager.getEntity(400)

assert.strictEqual(entity, null)

entity = entityManager.getEntity(1)

assert.notStrictEqual(entity, null)

if (entity !== null) {
    let hasComponent = entityManager.hasComponent(entity.id, Test)
    
    assert.strictEqual(hasComponent, true)
}

entity = entityManager.getEntity(2)

assert.notStrictEqual(entity, null)

if (entity !== null) {
    let hasComponent = entityManager.hasComponent(entity.id, Test)
    
    assert.strictEqual(hasComponent, false)
}

let i = 0
for (const entity of entityManager.iterateEntities([ Test ])) {
    assert.deepStrictEqual(entity.components, [ Test ])
    ++i
}

assert.strictEqual(i, 2)

i = 0
for (const entity of entityManager.getEntitiesByIds([ 1, 4, 18, 2, 401, 16 ])) {
    assert.deepStrictEqual(Array.isArray(entity.components), true)
    ++i
}

// does not count 401, since it's out-of-range
assert.strictEqual(i, 5)

console.log('!!! success !!!')