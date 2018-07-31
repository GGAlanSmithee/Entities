import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('hasComponent(id, component)', () => {
        beforeEach(() => {
            this.maxEntityCount = 100
            this.entityManager = new EntityManager(this.maxEntityCount)

            this.entityId1 = 1
            this.entityId2 = 2
            this.entityId3 = 3
            this.entityId4 = 4
            this.nonExistingEntityId = this.maxEntityCount + 1
            
            this.position = 'pos'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 'vel'
            this.velocityComponent = 0.25
            
            this.stats = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }

            this.nonExistingComponent = 'asfad'
            
            this.components = [ this.position, this.velocity, this.stats, ]
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.entities[this.entityId1].components = [ ...this.components, ]
            this.entityManager.entities[this.entityId2].components = [ this.position, this.velocity, ]
            this.entityManager.entities[this.entityId3].components = [ this.stats, ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.hasComponent).to.be.a('function')
        })

        test('returns [true] if entity with [id] has component with [key]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.position)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.velocity)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId1, this.stats)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId2, this.position)).to.be.true
            expect(this.entityManager.hasComponent(this.entityId2, this.velocity)).to.be.true

            expect(this.entityManager.hasComponent(this.entityId3, this.stats)).to.be.true
        })

        test('returns [false] if entity with [id] does not has component with [key]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, this.nonExistingComponent)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId2, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId2, this.nonExistingComponent)).to.be.false

            expect(this.entityManager.hasComponent(this.entityId3, this.position)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId3, this.nonExistingComponent)).to.be.false
        })

        test('returns [false] if entity with [id] does not exists', () => {
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.position)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(this.nonExistingEntityId, this.nonExistingComponent)).to.be.false
        })

        test('returns [false] if invalid entity [id]', () => {
            expect(this.entityManager.hasComponent([], this.position)).to.be.false
            expect(this.entityManager.hasComponent({}, this.velocity)).to.be.false
            expect(this.entityManager.hasComponent(null, this.stats)).to.be.false
            expect(this.entityManager.hasComponent(undefined, this.position)).to.be.false
            expect(this.entityManager.hasComponent('', this.position)).to.be.false
            expect(this.entityManager.hasComponent('1', this.position)).to.be.false
            expect(this.entityManager.hasComponent(new Map(), this.position)).to.be.false
        })

        test('returns [false] if invalid component [key]', () => {
            expect(this.entityManager.hasComponent(this.entityId1, '')).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, null)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, undefined)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, )).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, [])).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, {})).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, 1)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, 1.2)).to.be.false
            expect(this.entityManager.hasComponent(this.entityId1, new Map())).to.be.false
        })
    })
})