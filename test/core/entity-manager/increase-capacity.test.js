import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('increaseCapacity()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
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
            expect(this.entityManager.increaseCapacity).to.be.a('function')
        })
        
        test('increases capacity to be twice its old size', () => {
            expect(this.entityManager.capacity).to.equal(100)
            
            this.entityManager.increaseCapacity()
            
            expect(this.entityManager.capacity).to.equal(200)
            
            this.entityManager.increaseCapacity()
            
            expect(this.entityManager.capacity).to.equal(400)
            
            this.entityManager.increaseCapacity()
            
            expect(this.entityManager.capacity).to.equal(800)
        })
            
        test('adds entities as capacity is increased', () => {
            expect(this.entityManager.entities).property('length').to.equal(100)
            
            this.entityManager.increaseCapacity()
            
            expect(this.entityManager.entities).property('length').to.equal(200)
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.be.any.instanceof(Object)
                expect(this.entityManager.entities[i]).property('components').to.deep.equal([])
            }
            
            this.entityManager.increaseCapacity()
            
            expect(this.entityManager.entities).property('length').to.equal(400)
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i]).to.be.any.instanceof(Object)
                expect(this.entityManager.entities[i]).property('components').to.deep.equal([])
            }
        })
        
        test('adds ids to the newly created entities as the capacity is increased', () => {
            let count = 0

            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i].id).to.equal(i)

                count = i
            }

            expect(count).to.equal(99)

            this.entityManager.increaseCapacity()
            
            count = 0

            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i].id).to.equal(i)

                count = i
            }

            expect(count).to.equal(199)
            
            this.entityManager.increaseCapacity()

            count = 0
            
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i].id).to.equal(i)
                
                count = i
            }

            expect(count).to.equal(399)
        })

        test('adds components to the newly created entities as the capacity is increased', () => {
            this.entityManager.increaseCapacity()
            
            for (let i = 100; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i][this.position]).to.deep.equal(this.positionComponent)
                expect(this.entityManager.entities[i][this.velocity]).to.deep.equal(this.velocityComponent)
                expect(this.entityManager.entities[i][this.stats]).to.deep.equal(this.statsComponent)
            }
            
            this.entityManager.increaseCapacity()
            
            for (let i = 200; i < this.entityManager.capacity; ++i) {
                expect(this.entityManager.entities[i][this.position]).to.deep.equal(this.positionComponent)
                expect(this.entityManager.entities[i][this.velocity]).to.deep.equal(this.velocityComponent)
                expect(this.entityManager.entities[i][this.stats]).to.deep.equal(this.statsComponent)
            }
        })
    })
})