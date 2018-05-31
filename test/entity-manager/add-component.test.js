import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('addComponent(entityId, componentKey)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.entityId = 0
            
            this.position = 1
            this.positionName = 'position'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityName = 'velocity'
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsName = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.statsName, this.stats)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.addComponent).to.be.a('function')
        })
        
        test('adds a component to an entity by adding it to the entity\'s component mask', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.be.a.number
            
            expect((entity.components & this.position) === this.position).to.be.false
            expect((entity.components & this.velocity) === this.velocity).to.be.false
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.false
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.velocity)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.true
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.stats)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.true
            expect((entity.components & this.stats) === this.stats).to.be.true
        })
        
        test('adds a component to an entity by name', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.be.a.number
            
            expect((entity.components & this.position) === this.position).to.be.false
            expect((entity.components & this.velocity) === this.velocity).to.be.false
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.positionName)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.false
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.velocityName)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.true
            expect((entity.components & this.stats) === this.stats).to.be.false
            
            this.entityManager.addComponent(this.entityId, this.statsName)
            
            expect((entity.components & this.position) === this.position).to.be.true
            expect((entity.components & this.velocity) === this.velocity).to.be.true
            expect((entity.components & this.stats) === this.stats).to.be.true
        })
        
        test('does not add additional components if the component is already present on the entity', () => {
            const entity = this.entityManager.entities[this.entityId]
            expect(entity).property('components').to.equal(0)
            
            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.stats)
            expect(entity).property('components').to.equal(5)
            
            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').to.equal(5)
        })
    })
})