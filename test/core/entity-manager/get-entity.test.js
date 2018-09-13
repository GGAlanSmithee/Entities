import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('getEntity(id)', () => {
        beforeEach(() => {
            this.maxEntityCount = 100
            this.entityManager = new EntityManager(this.maxEntityCount)

            this.entityId1 = 1
            this.entityId2 = 2
            this.entityId3 = 3
            
            this.position = 'pos'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 'vel'
            this.velocityComponent = 0.25
            
            this.stats = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = [ this.position, this.velocity, this.stats, ]
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.entities[this.entityId1].components = [ ...this.components, ]
            this.entityManager.entities[this.entityId2].components = [ this.position, this.velocity, ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.getEntity).to.be.a('function')
        })

        test('gets an entity by its [id]', () => {
            const entity1 = this.entityManager.getEntity(this.entityId1)
            const entity2 = this.entityManager.getEntity(this.entityId2)
            const entity3 = this.entityManager.getEntity(this.entityId3)
            const maxEntity = this.entityManager.getEntity(this.maxEntityCount)
            const overMaxEntity = this.entityManager.getEntity(this.maxEntityCount + 1)

            expect(entity1).to.not.be.null
            expect(entity2).to.not.be.null
            expect(entity3).to.not.be.null
            expect(maxEntity).to.be.null
            expect(overMaxEntity).to.be.null
        })

        test('returns null if [id] is not a positive integer', () => {
            expect(this.entityManager.getEntity(-1)).to.be.null
            expect(this.entityManager.getEntity(null)).to.be.null
            expect(this.entityManager.getEntity(undefined)).to.be.null
            expect(this.entityManager.getEntity('1')).to.be.null
            expect(this.entityManager.getEntity({ id: 1, })).to.be.null
            expect(this.entityManager.getEntity([ 1, ])).to.be.null
        })

        test('retrieved entity includes correct components', () => {
            const entity1 = this.entityManager.getEntity(this.entityId1)
            const entity2 = this.entityManager.getEntity(this.entityId2)
            const entity3 = this.entityManager.getEntity(this.entityId3)
            
            expect(entity1).property('components').to.be.an.instanceof(Array)
            expect(entity1).property('components').to.deep.equal(this.components)

            expect(entity2).property('components').to.be.an.instanceof(Array)
            expect(entity2).property('components').to.deep.equal([ this.position, this.velocity, ])
            
            expect(entity3).property('components').to.be.an.instanceof(Array)
            expect(entity3).property('components').to.deep.equal([])
        })
    })
})