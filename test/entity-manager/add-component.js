import { expect }    from 'chai'
import EntityManager from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('addComponent(entityId, componentKey)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.entityId = 0
            
            this.position = 'position'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 'velocity'
            this.velocityComponent = 0.25
            
            this.stats = 'stats'
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
        
        it('adds a component to an entity by adding it to the entity\'s [component] array', () => {
            expect(this.entityManager.entities[this.entityId]).property('components').to.be.an.instanceof(Array).and.to.be.empty
            
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.position)
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.velocity)
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.stats)
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(0)
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.position)
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.velocity)
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.stats)
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.velocity)
            
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.position)
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.velocity)
            expect(this.entityManager.entities[this.entityId]).property('components').to.not.contain(this.stats)
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(2)
            
            this.entityManager.addComponent(this.entityId, this.stats)
            
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.position)
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.velocity)
            expect(this.entityManager.entities[this.entityId]).property('components').to.contain(this.stats)
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(3)
        })
        
        it('does not add additional components if the component is already present on the entity', () => {
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(0)
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.stats)
            
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(2)
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect(this.entityManager.entities[this.entityId]).property('components').property('length').to.equal(2)
        })
    })
})