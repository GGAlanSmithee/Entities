import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('hasComponent(id, component)', () => {
        beforeEach(() => {
            this.maxEntityCount = 100
            this.entityManager = new EntityManager(this.maxEntityCount)
            this.entityManager.currentMaxEntity = 5

            this.entityId1 = 1
            this.entityId2 = 2
            this.entityId3 = 3
            this.entityId4 = 4
            this.nonExistingEntityId = this.maxEntityCount + 1
            
            this.position = 1
            this.positionName = 'pos'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityName = 'vel'
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsName = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }

            this.nonExistingComponent = 8
            this.nonExistingComponentName = 'none'
            
            this.components = this.position | this.velocity | this.stats
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.statsName, this.stats)

            this.entityManager.entities[this.entityId1].components = this.components
            this.entityManager.entities[this.entityId2].components = this.position | this.velocity
            this.entityManager.entities[this.entityId3].components = this.stats
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.hasComponent).to.be.a('function')
        })

        test('returns [true] if entity with [id] has component with [id]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.position)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.velocity)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.stats)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId2, this.position)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId2, this.velocity)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId3, this.stats)).to.be.true
        })

        test('returns [false] if entity with [id] does not has component with [id]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.nonExistingComponent)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId2, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId2, this.nonExistingComponent)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId3, this.position)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.nonExistingComponent)).to.be.false
        })

        test('returns [true] if entity with [id] has component with [name]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.positionName)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.velocityName)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.statsName)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId2, this.positionName)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId2, this.velocityName)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId3, this.statsName)).to.be.true
        })

        test('returns [false] if entity with [id] does not has component with [name]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.nonExistingComponentName)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId2, this.statsName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId2, this.nonExistingComponentName)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId3, this.positionName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.velocityName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.nonExistingComponentName)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId4, this.position)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.nonExistingComponent)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId4, this.positionName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.velocityName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.statsName)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId4, this.nonExistingComponentName)).to.be.false
        })

        test('returns [false] if entity with [id] does not exists', () => {
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.position)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.nonExistingComponent)).to.be.false
    
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.positionName)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.velocityName)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.statsName)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.nonExistingComponentName)).to.be.false
        })
    })
})