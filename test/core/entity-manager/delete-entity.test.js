import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    beforeEach(() => {
        this.entityManager = new EntityManager(100)
        
        this.entityId = 5
        
        this.position = 'pos'
        this.positionComponent = { x : 1, y : 1, z : -2 }
        
        this.velocity = 'vel'
        this.velocityComponent = 0.25
        
        this.stats = 'stats'
        this.statsComponent = { xp : 10000, level : 20 }
        
        this.components = [ this.position, this.velocity, this.stats, ]
        this.entityManager._componentManager.components.set(this.position, this.positionComponent)
        this.entityManager._componentManager.components.set(this.velocity, this.velocityComponent)
        this.entityManager._componentManager.components.set(this.stats, this.statsComponent)
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
        
        test('\'removes\' an entity by emptying its [components] array', () => {
            for (let entity of this.entityManager.entities) {
                expect(entity.components).to.deep.equal(this.components)
            }
            
            this.entityManager.deleteEntity(this.entityId)
            
            let idx = 0
            
            for (let entity of this.entityManager.entities) {
                if (idx === this.entityId) {
                    expect(entity.components).to.deep.equal([])
                    expect(entity.components).to.be.empty
                } else {
                    expect(entity.components).to.deep.equal(this.components)
                }
                
                ++idx
            }
        })

        test('invokes [systemManager].removeEntity with [id]', () => {
            const spy = sinon.spy(this.entityManager._systemManager, 'removeEntity')
            
            this.entityManager.deleteEntity(this.entityId)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.entityId)).to.be.true
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
})