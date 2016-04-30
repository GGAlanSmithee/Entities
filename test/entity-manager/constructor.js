import { expect }       from 'chai'
import EntityManager    from '../../src/core/entity-manager'
import EntityFactory    from '../../src/core/entity-factory'
import EventHandler     from '../../src/core/event-handler'
import SystemManager    from '../../src/core/system-manager'
import ComponentManager from '../../src/core/component-manager'

describe('EntityManager', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(EntityManager).to.be.a('function')
        })
        
        it('can be used to instantiate a new EntityManager', () => {
            expect(this.entityManager).to.be.an.instanceof(EntityManager)
        })
        
        it('sets [capacity] to 1000', () => {
            expect(this.entityManager).property('capacity').to.equal(1000)
        })
        
        it('creates 1000 empty entities', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array)
            expect(this.entityManager).property('entities').property('length').to.equal(1000)
        })
        
        it('creates [entityConfigurations] as an empty Map', () => {
            expect(this.entityManager).property('entityConfigurations').to.be.an.instanceof(Map).and.to.be.empty
        })
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.entityManager.currentMaxEntity).to.equal(-1)
        })
        
        it('instantiates [entityFactory] as an instance of [EntityFactory]', () => {
            expect(this.entityManager).property('entityFactory').to.be.an.instanceof(EntityFactory)
        })
        
        it('instantiates [eventHandler] as an instance of [EventHandler]', () => {
            expect(this.entityManager).property('eventHandler').to.be.an.instanceof(EventHandler)
        })
        
        it('instantiates [componentManager] as an instance of [ComponentManager]', () => {
            expect(this.entityManager).property('componentManager').to.be.an.instanceof(ComponentManager)
        })
        
        it('instantiates [systemManager] as an instance of [SystemManager]', () => {
            expect(this.entityManager).property('systemManager').to.be.an.instanceof(SystemManager)
        })
    })
    
    describe('constructor(capacity)', () => {
        beforeEach(() => {
            this.capacity = 2000
            this.entityManager = new EntityManager(this.capacity)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('sets [capacity] equal to the passed in value', () => {
            expect(this.entityManager).property('capacity').to.equal(this.capacity)
        })
        
        it('creates [capacity] number of empty entities', () => {
            expect(this.entityManager).property('entities').to.be.an.instanceof(Array)
            expect(this.entityManager).property('entities').property('length').to.equal(this.capacity)
            
            for (let entity of this.entityManager.entities) {
                expect(entity).to.be.an.instanceof(Object)
                expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
            }
        })
        
        it('sets [currentMaxEntity] to -1', () => {
            expect(this.entityManager.currentMaxEntity).to.equal(-1)
        })
    })
})