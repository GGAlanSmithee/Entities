import * as assert from 'assert'
import { SystemType, EntityManager, Entity } from 'gg-entities'

const Test = 'test'

class TestComponent {
    x = 100
    y = 100
}

const Pos = 'pos'

const PosComponent = {
    x: 100,
    y: 100,
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
entityManager.registerComponent(Pos, PosComponent)

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

// System Manager

const Render = 'render'

function RenderSystem(entities: IterableIterator<Entity>, obj: object) {
    let i = 0

    for (const entity of entities) {
        assert.deepStrictEqual(entity.components, [ Pos, Test, ])
        ++i
    }

    assert.strictEqual(i, 3)
}

entityManager.registerSystem(SystemType.Render, Render, [ Pos, Test, ], RenderSystem)

const entities = entityManager
    .build()
    .withComponent(Pos)
    .withComponent(Test, () => { return new TestComponent() })
    .create(3)

assert.deepStrictEqual(entities[0].components, [ Pos, Test ])
assert.deepStrictEqual(entities[1].components, [ Pos, Test ])
assert.deepStrictEqual(entities[2].components, [ Pos, Test ])

entityManager.onRender()


// registerLogicSystem(key: SystemKey, components: ComponentKeyArray, callback: Function): void

// registerRenderSystem(key: SystemKey, components: ComponentKeyArray, callback: Function): void

// registerInitSystem(key: SystemKey, components: ComponentKeyArray, callback: Function): void

// removeSystem(key: SystemKey): boolean

// onLogic(opts: any): void

// onInit(opts: any): void

// // Entity Factory

// registerInitializer(component: ComponentKey, initializer: any): void

// // Event Handler

// listen(event: string, callback: Function): number

// stopListen(eventId: EventId): boolean

// trigger(): Promise<any>

// triggerDelayed(): Promise<any>

console.log('!!! success !!!')