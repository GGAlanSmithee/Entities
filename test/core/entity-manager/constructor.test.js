import { expect }           from 'chai'
import { EntityManager }    from '../../../src/core/entity-manager'
import { EntityFactory }    from '../../../src/core/entity-factory'
import { EventHandler }     from '../../../src/core/event-handler'
import { SystemManager }    from '../../../src/core/system-manager'
import { ComponentManager } from '../../../src/core/component-manager'

describe('EntityManager', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(EntityManager).to.be.a('function')
        })
        
        test('can be used to instantiate a new EntityManager', () => {
            expect(this.entityManager).to.be.an.instanceof(EntityManager)
        })
        
        test('sets [capacity] to 1000', () => {
            expect(this.entityManager).property('capacity').to.equal(1000)
        })
        
        test('creates 1000 empty entities', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array)
            expect(this.entityManager).property('entities').property('length').to.equal(1000)
        })
        
        test('creates [_entityConfigurations] as an empty Map', () => {
            expect(this.entityManager).property('_entityConfigurations').to.be.an.instanceof(Map).and.to.be.empty
        })

        test('instantiates [_entityFactory] as an instance of [EntityFactory]', () => {
            expect(this.entityManager).property('_entityFactory').to.be.an.instanceof(EntityFactory)
        })
        
        test('instantiates [_eventHandler] as an instance of [EventHandler]', () => {
            expect(this.entityManager).property('_eventHandler').to.be.an.instanceof(EventHandler)
        })
        
        test('instantiates [_componentManager] as an instance of [ComponentManager]', () => {
            expect(this.entityManager).property('_componentManager').to.be.an.instanceof(ComponentManager)
        })
        
        test('instantiates [_systemManager] as an instance of [SystemManager]', () => {
            expect(this.entityManager).property('_systemManager').to.be.an.instanceof(SystemManager)
        })
    })
    
    describe('constructor(capacity)', () => {
        beforeEach(() => {
            this.capacity = 200
            this.entityManager = new EntityManager(this.capacity)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('sets [capacity] equal to the passed in value', () => {
            expect(this.entityManager).property('capacity').to.equal(this.capacity)
        })
        
        test('creates [capacity] number of entities, with no components and an id', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array)
            expect(this.entityManager).property('entities').property('length').to.equal(this.capacity)
            

            for (let i = 0; i < this.entityManager.entities.length; ++i) {
                const entity = this.entityManager.entities[i]

                expect(entity.id).to.be.equal(i)
                expect(entity).to.be.an.instanceof(Object)
                expect(entity).property('components').to.deep.equal([])
                expect(entity).property('data').to.deep.equal({})
            }
        })
    })
})