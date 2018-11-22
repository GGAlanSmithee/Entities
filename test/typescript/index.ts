import * as assert from 'assert'
import { SystemType, EntityManager, Entity } from 'gg-entities'

const Test = 'test'

class TestComponent {
    x = 100
    y = 100
}

const Test2 = 'test2'

class SecondTestComponent {
    value = 'somewhere...'
}

const Pos = 'pos'

const PosComponent: object = {
    x: 100,
    y: 100,
}

const Data = {
    key: 'value',
    additionalData: 42,
}

assert.strictEqual(SystemType.Logic, 0)
assert.strictEqual(SystemType.Render, 1)
assert.strictEqual(SystemType.Init, 2)

const entityManager = new EntityManager(100)

assert.deepStrictEqual(entityManager.entityConfigurations, new Map())

assert.strictEqual(entityManager.entities.length, 100)
assert.strictEqual(entityManager.capacity, 100)

entityManager.increaseCapacity()

assert.strictEqual(entityManager.entities.length, 200)
assert.strictEqual(entityManager.capacity, 200)

entityManager.increaseCapacity()

assert.strictEqual(entityManager.entities.length, 400)
assert.strictEqual(entityManager.capacity, 400)

entityManager.registerComponent(Test, TestComponent)
entityManager.registerComponent(Test2, SecondTestComponent)
entityManager.registerComponent(Pos, PosComponent)

assert.deepStrictEqual(
    entityManager.components,
    new Map([[ Test, TestComponent, ], [ Test2, SecondTestComponent, ], [ Pos, PosComponent, ]]))

let entity = entityManager.newEntity([ Test ])

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 0)
    assert.deepStrictEqual(entity.components, [ Test ])

    entityManager.deleteEntity(entity.id)

    assert.deepStrictEqual(entity.components, [ ])
}

entity = entityManager.newEntity([ Test ], Data)

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.strictEqual(entity.id, 0)
    assert.deepStrictEqual(entity.components, [ Test ])
}

entity = entityManager.newEntity([ Test ], Data)

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
for (const entity of entityManager.getEntitiesByComponents([ Test ])) {
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

entity = entityManager.getEntity(3)

assert.notStrictEqual(entity, null)

if (entity !== null) {
    assert.deepStrictEqual(entity.components, [])
    
    entityManager.addComponent(entity.id, Pos)

    assert.deepStrictEqual(entity.components, [ Pos ])

    entityManager.addComponent(entity.id, Test)

    assert.deepStrictEqual(entity.components, [ Pos, Test ])

    entityManager.removeComponent(entity.id, Pos)

    assert.deepStrictEqual(entity.components, [ Test ])
}

const Render = 'render'

function RenderSystem(entities: IterableIterator<Entity>, _obj: object) {
    let i = 0

    for (const entity of entities) {
        assert.deepStrictEqual(entity.components, [ Pos, Test, Test2 ])
        ++i
    }

    assert.strictEqual(i, 3)
}

entityManager.registerSystem(SystemType.Render, Render, [ Pos, Test, Test2 ], RenderSystem)

let entities = entityManager
    .build()
    .withComponent(Pos)
    .withComponent(Test, () => new TestComponent())
    .withComponent(Test2)
    .withData(Data)
    .create(3)

assert.deepStrictEqual(entities[0].components, [ Pos, Test, Test2 ])
assert.deepStrictEqual(entities[0].data, Data)
assert.deepStrictEqual(entities[1].components, [ Pos, Test, Test2 ])
assert.deepStrictEqual(entities[1].data, Data)
assert.deepStrictEqual(entities[2].components, [ Pos, Test, Test2 ])
assert.deepStrictEqual(entities[2].data, Data)

entityManager.onRender()

let removed = entityManager.removeSystem(Render)
assert.strictEqual(removed, true)

removed = entityManager.removeSystem(Render)
assert.strictEqual(removed, false)

const PosKey = 'pos'

function PosSystem(entities: IterableIterator<Entity>, obj: object) {
    let i = 0

    for (const entity of entities) {
        assert.deepStrictEqual(entity.components.includes(Pos), true)
        ++i
    }

    assert.strictEqual(i, 3)
}

entityManager.registerInitSystem(PosKey, [ Pos ], PosSystem)

entityManager.onInit()

const TestKey = 'test'

function TestSystem(entities: IterableIterator<Entity>, obj: object) {
    let i = 0

    for (const entity of entities) {
        assert.deepStrictEqual(entity.components.includes(Test), true)
        ++i
    }

    assert.strictEqual(i, 6)
}

entityManager.registerLogicSystem(TestKey, [ Test ], TestSystem)

entityManager.onLogic()

removed = entityManager.removeSystem(Pos)
assert.strictEqual(removed, true)

removed = entityManager.removeSystem(Pos)
assert.strictEqual(removed, false)

removed = entityManager.removeSystem(Test)
assert.strictEqual(removed, true)

removed = entityManager.removeSystem(Test)
assert.strictEqual(removed, false)

let [ ent ] = entityManager
    .build()
    .withComponent(Pos)
    .withData({ test: 'Testing', })
    .create(1)

assert.strictEqual(ent[Pos].x, 100)
assert.strictEqual(ent[Pos].y, 100)
assert.strictEqual(ent.data.test, 'Testing')

const init = (c: { x: number, y: number }) => ({
    ...c,
    x: 200,
    y: 200,
})

entityManager.registerInitializer(Pos, init)

let [ ent2 ] = entityManager
    .build()
    .withComponent(Pos)
    .withData({ hi: 'bye', })
    .create(1)

assert.strictEqual(ent2[Pos].x, 200)
assert.strictEqual(ent2[Pos].y, 200)
assert.strictEqual(ent2.data.hi, 'bye')

let [ ent3 ] = entityManager
    .build()
    .withComponent(Pos, (c: { x: number, y: number }) => ({ ...c, x: 150, y: 175, }))
    .create(1)

assert.strictEqual(ent3[Pos].x, 150)
assert.strictEqual(ent3[Pos].y, 175)
assert.deepStrictEqual(ent3.data, {})

let [ ent4 ] = entityManager
    .build()
    .withData({ myProperty: 'myValue', })
    .withComponent(Test2, (c: { x: number, y: number }) => ({ ...c, x: 13 }))
    .create(1)

assert.strictEqual(ent4[Test2].x, 13)
assert.strictEqual(ent4[Test2].value, 'somewhere...')
assert.deepStrictEqual(ent4.data, { myProperty: 'myValue', })


const TestEvent = 'test'

function TestCallback(this: any, obj = {}) {
    assert.strictEqual(this instanceof EntityManager, true)
    assert.deepStrictEqual({ myVal: 1, myName: 'hi', }, obj)
}

const event = entityManager.listen(TestEvent, TestCallback)

assert.strictEqual(event, 0)

entityManager.trigger(TestEvent, { myVal: 1, myName: 'hi', })

const doIt = async () => {
    await entityManager.triggerDelayed(TestEvent, 250, { myVal: 1, myName: 'hi', })
}

let stopped = entityManager.stopListen(event)
assert.strictEqual(stopped, true)

stopped = entityManager.stopListen(event)
assert.strictEqual(stopped, false)

doIt().then(() => {
    console.log('!!! success !!!')
})
