import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

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
            
            this.entityManager._componentManager.components.set(this.position, this.positionComponent)
            this.entityManager._componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager._componentManager.components.set(this.stats, this.statsComponent)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.addComponent).to.be.a('function')
        })
        
        test('adds a component to an entity by adding it to the entity\'s [components] array', () => {
            const entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
            
            expect(entity.components).to.not.contain(this.position)
            expect(entity.components).to.not.contain(this.velocity)
            expect(entity.components).to.not.contain(this.stats)
            
            this.entityManager.addComponent(this.entityId, this.position)
            
            expect(entity.components).to.contain(this.position)
            expect(entity.components).to.not.contain(this.velocity)
            expect(entity.components).to.not.contain(this.stats)
            
            this.entityManager.addComponent(this.entityId, this.velocity)
            
            expect(entity.components).to.contain(this.position)
            expect(entity.components).to.contain(this.velocity)
            expect(entity.components).to.not.contain(this.stats)

            this.entityManager.addComponent(this.entityId, this.stats)
            
            expect(entity.components).to.contain(this.position)
            expect(entity.components).to.contain(this.velocity)
            expect(entity.components).to.contain(this.stats)
        })
        
        test('does not add additional components if the component is already present on the entity', () => {
            const entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
            expect(entity).property('components').property('length').to.equal(0)

            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').property('length').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').property('length').to.equal(1)
            
            this.entityManager.addComponent(this.entityId, this.stats)
            expect(entity).property('components').property('length').to.equal(2)
            
            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').property('length').to.equal(2)

            this.entityManager.addComponent(this.entityId, this.stats)
            expect(entity).property('components').property('length').to.equal(2)

            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').property('length').to.equal(2)

            this.entityManager.addComponent(this.entityId, this.velocity)
            expect(entity).property('components').property('length').to.equal(3)

            this.entityManager.addComponent(this.entityId, this.velocity)
            expect(entity).property('components').property('length').to.equal(3)

            this.entityManager.addComponent(this.entityId, this.stats)
            expect(entity).property('components').property('length').to.equal(3)

            this.entityManager.addComponent(this.entityId, this.position)
            expect(entity).property('components').property('length').to.equal(3)
        })

        test('does not add components if the [component] is not a non-null string', () => {
            const entity = this.entityManager.entities[this.entityId]
            
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
            
            this.entityManager.addComponent(this.entityId, 1)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, 1.5)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, -1)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, [])
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, {})
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, new Map())
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, null)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId, undefined)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty

            this.entityManager.addComponent(this.entityId)
            expect(entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
        })
    })
})