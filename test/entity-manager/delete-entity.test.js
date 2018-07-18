import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    beforeEach(() => {
        this.entityManager = new EntityManager(100)
        
        this.entityId = 5
        
        this.position = 1
        this.positionComponent = { x : 1, y : 1, z : -2 }
        
        this.velocity = 2
        this.velocityComponent = 0.25
        
        this.stats = 4
        this.statsComponent = { xp : 10000, level : 20 }
        
        this.components = 1 | 2 | 4
        this.entityManager.componentManager.components.set(this.position, this.positionComponent)
        this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
        this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
    })
        
    describe('deleteEntity(entityId)', () => {
        beforeEach(() => {
            for (let entity of this.entityManager.entities) {
                entity.components = this.components
                entity[this.position] = this.positionComponent
                entity[this.velocity] = this.velocityComponent
                entity[this.stats] = this.statsComponent
            }
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.deleteEntity).to.be.a('function')
        })
        
        test('\'removes\' an entity by settings its [components] mask to 0', () => {
            for (let entity of this.entityManager.entities) {
                expect(entity.components).to.deep.equal(this.components)
            }
            
            this.entityManager.deleteEntity(this.entityId)
            
            let idx = 0
            
            for (let entity of this.entityManager.entities) {
                if (idx === this.entityId) {
                    expect(entity.components).to.equal(0)
                } else {
                    expect(entity.components).to.deep.equal(this.components)
                }
                
                ++idx
            }
        })
        
        test('does not remove the actual components from an entity when deleting an entity', () => {
            for (let entity of this.entityManager.entities) {
                expect(entity[this.position]).to.equal(this.positionComponent)
                expect(entity[this.velocity]).to.equal(this.velocityComponent)
                expect(entity[this.stats]).to.equal(this.statsComponent)
            }
            
            this.entityManager.deleteEntity(2)
            this.entityManager.deleteEntity(4)
            
            for (let entity of this.entityManager.entities) {
                expect(entity[this.position]).to.equal(this.positionComponent)
                expect(entity[this.velocity]).to.equal(this.velocityComponent)
                expect(entity[this.stats]).to.equal(this.statsComponent)
            }
        })
        
        test('deletes an entity even when [currentMaxEntity] is higher than the entity being deleted', () => {
            expect(this.entityManager.entities[this.entityId].components).to.equal(this.components)
            
            this.entityManager.deleteEntity(this.entityId)
            
            expect(this.entityManager.entities[this.entityId].components).to.equal(0)
        })
        
        test('exits early when [entity] is more than [maxEntity]', () => {
            let oldLength = this.entityManager.entities.length
            
            this.entityManager.deleteEntity(this.entityManager.currentMaxEntity + 1)
            
            expect(this.entityManager.entities).property('length').to.equal(oldLength)
        })

        test('exits early when [entity] isn´t a positive integer', () => {
            let oldLength = this.entityManager.entities.length
            
            this.entityManager.deleteEntity(-1)
            this.entityManager.deleteEntity('')
            this.entityManager.deleteEntity(undefined)
            this.entityManager.deleteEntity(null)
            this.entityManager.deleteEntity()
            this.entityManager.deleteEntity([])
            this.entityManager.deleteEntity({})
            
            expect(this.entityManager.entities).property('length').to.equal(oldLength)
        })

    })
    
    describe('deleteEntity(entityId)', () => {
        test('sets [currentMaxEntity] to the next entity that has one or more component, if the deleted entity was the prior highest entity', () => {
            this.entityManager.currentMaxEntity = 50
            
            this.entityManager.entities[2].components = this.components
            this.entityManager.entities[4].components = this.components
            this.entityManager.entities[5].components = this.position
            this.entityManager.entities[13].components = this.vel | this.position
            this.entityManager.entities[50].components = this.stats
            
            expect(this.entityManager.currentMaxEntity).to.equal(50)
            
            this.entityManager.deleteEntity(50)
            expect(this.entityManager.currentMaxEntity).to.equal(13)
            
            this.entityManager.deleteEntity(25)
            expect(this.entityManager.currentMaxEntity).to.equal(13)
            
            this.entityManager.deleteEntity(13)
            expect(this.entityManager.currentMaxEntity).to.equal(5)
            
            this.entityManager.deleteEntity(2)
            expect(this.entityManager.currentMaxEntity).to.equal(5)
            
            this.entityManager.deleteEntity(5)
            expect(this.entityManager.currentMaxEntity).to.equal(4)
            
            this.entityManager.deleteEntity(1)
            expect(this.entityManager.currentMaxEntity).to.equal(4)
            
            this.entityManager.deleteEntity(4)
            expect(this.entityManager.currentMaxEntity).to.equal(0)
            
            this.entityManager.deleteEntity(0)
            expect(this.entityManager.currentMaxEntity).to.equal(0)
        })
    })

})