import { expect }    from 'chai'
import EntityManager from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('removeComponent(entityId, componentId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
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
            
            this.entityManager.entities[this.entityId].components = [ this.position, this.velocity, this.stats ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.removeComponent).to.be.a('function')
        })
        
        it('removes a component from an entity by removing [component] from its [components]', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.contain(this.position)
            expect(entity).property('components').to.contain(this.velocity)
            expect(entity).property('components').to.contain(this.stats)
            
            this.entityManager.removeComponent(this.entityId, this.position)
            
            expect(entity).property('components').to.not.contain(this.position)
            expect(entity).property('components').to.contain(this.velocity)
            expect(entity).property('components').to.contain(this.stats)
            
            this.entityManager.removeComponent(this.entityId, this.velocity)
            
            expect(entity).property('components').to.not.contain(this.position)
            expect(entity).property('components').to.not.contain(this.velocity)
            expect(entity).property('components').to.contain(this.stats)
            
            this.entityManager.removeComponent(this.entityId, this.stats)
            
            expect(entity).property('components').to.not.contain(this.position)
            expect(entity).property('components').to.not.contain(this.velocity)
            expect(entity).property('components').to.not.contain(this.stats)
            
            expect(entity).property('components').to.be.empty
            expect(this.entityManager.entities[this.entityId]).property('components').to.be.empty
        })
        
        it('does nothing if [component] is not present in the entity', () => {
            let entity = this.entityManager.entities[this.entityId]
            
            this.entityManager.removeComponent(this.entityId, `not a ${this.position}`)
            
            expect(entity).property('components').to.deep.equal([ this.position, this.velocity, this.stats ])
            
            this.entityManager.removeComponent(this.entityId, this.position)
            
            expect(entity).property('components').to.deep.equal([ this.velocity, this.stats ])
        })
    })
})