import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('newEntity(components)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
            this.position = 1
            this.positionName = 'position'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityName = 'velocity'
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsName = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = this.position | this.velocity | this.stats
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.componentNames = [ this.positionName, this.velocityName, this.statsName ]
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.statsName, this.stats)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.newEntity).to.be.a('function')
        })
        
        test('adds and returns an object containing an id and corresponding entity, given correct [components] input', () => {
            let res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(0)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
            
            res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(1)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
        })
        
        test('correctly creates an entity given an array of component names (as defined in the [componentLookup])', () => {
            let res = this.entityManager.newEntity(this.componentNames)
            
            expect(res.id).to.equal(0)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
            
            res = this.entityManager.newEntity(this.componentNames)
            
            expect(res.id).to.equal(1)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
        })

        test('correctly creates an entity given an array of not all registered component names', () => {
            const componentNames = [ this.positionName, this.statsName ]

            let res = this.entityManager.newEntity(componentNames)
            
            expect(res.id).to.equal(0)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
            
            res = this.entityManager.newEntity(componentNames)
            
            expect(res.id).to.equal(1)
            expect(res.entity).to.deep.equal(this.entityManager.entities[res.id])
            expect(res.entity.components).to.equal(this.position | this.stats)
        })
        
        test('does not add an entity and returns [capacity], given wrong [components] input', () => {
            const capacity = this.entityManager.capacity
            
            let res = this.entityManager.newEntity()
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity('not a number')
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity('')
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(null)
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(undefined)
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(0)
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(-1)
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity('1')
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(1.5)
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity({})
            expect(res.id).to.equal(capacity)
            expect(res.entity).to.be.null
        })
        
        test('sets the [components] property of entities[entityId] to passed in [components]', () => {
            let { id, entity } = this.entityManager.newEntity(this.components)
            
            expect(this.entityManager.entities[id].components).to.deep.equal(this.components)
            expect(entity.components).to.deep.equal(this.components)
        })
        
        test('returns capacity and does not add an entity if there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.newEntity(this.position)
            }
            
            let res = this.entityManager.newEntity(this.position)
            expect(res.id).to.equal(this.entityManager.capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(this.position)
            expect(res.id).to.equal(this.entityManager.capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(this.position, this.stats)
            expect(res.id).to.equal(this.entityManager.capacity)
            expect(res.entity).to.be.null
            
            res = this.entityManager.newEntity(this.velocity)
            expect(res.id).to.equal(this.entityManager.capacity)
            expect(res.entity).to.be.null
        })
        
        test('increases [currentMaxEntity] if [entityId] is larger than [currentMaxEntity]', () => {
            this.entityManager.currentMaxEntity = 0
            
            let res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(0)
            expect(this.entityManager.currentMaxEntity).to.equal(0)
            
            res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(1)
            expect(this.entityManager.currentMaxEntity).to.equal(1)
            
            res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(2)
            expect(this.entityManager.currentMaxEntity).to.equal(2)
            
            this.entityManager.entities[1].components = 0
            
            res = this.entityManager.newEntity(this.components)
            
            expect(res.id).to.equal(1)
            expect(this.entityManager.currentMaxEntity).to.equal(2)
        })
    })
})