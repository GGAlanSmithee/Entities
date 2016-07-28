import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('addComponent(entityId, componentKey)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.entityId = 0
            
            this.position = 1
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.addComponent).to.be.a('function')
        })
        
        it('adds a component to an entity by adding it to the entity\'s component mask', () => {
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
        
        it('does not add additional components if the component is already present on the entity', () => {
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