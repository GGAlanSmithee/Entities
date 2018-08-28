import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('getEntitiesByComponents(components = 0)', () => {
        beforeEach(() => {
            this.maxEntityCount = 100
            this.entityManager = new EntityManager(this.maxEntityCount)
            
            this.entityId = 5
            
            this.position = 1
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = [ this.position, this.velocity, this.stats, ]
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.entities[this.entityId].components = [ ...this.components, ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a generator function', () => {
            expect(this.entityManager.getEntitiesByComponents).to.be.a('function')
        })
        
        test('returns an iterable of all entities', () => {
            let it = this.entityManager.getEntitiesByComponents()
            
            let i = 0
            let res = {}
            let next = {}
            
            while ((next = it.next()).done !== true) {
                res = next
                ++i
            }
            
            expect(res.value.id).to.equal(this.maxEntityCount-1)
            expect(i).to.equal(this.maxEntityCount)
            
            expect(it.next()).property('value').to.be.undefined
        })
            
        test('for each iteration, returns an object containing the [entity]', () => {
            let last = 0
            let i = 0
            for (let entity of this.entityManager.getEntitiesByComponents()) {
                expect(entity.id).to.equal(i)
                expect(entity).to.deep.equal(this.entityManager.entities[i])
                last = entity.id
                ++i
            }
            
            expect(last).to.equal(this.maxEntityCount-1)
            expect(i).to.equal(this.maxEntityCount)

            last = 0
            i = 0
            for (let entity of this.entityManager.getEntitiesByComponents()) {
                expect(entity.id).to.equal(i)
                expect(entity).to.deep.equal(this.entityManager.entities[i])
                last = entity.id
                ++i
            }

            expect(last).to.equal(this.maxEntityCount-1)
            expect(i).to.equal(this.maxEntityCount)
        })
        
        test('when called with [components], only returns entities that has [components]', () => {
            let visited = []
            
            for (const { id } of this.entityManager.getEntitiesByComponents([ this.position, this.stats ])) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1)
            
            this.entityManager.entities[2].components = [ this.position, this.velocity ]
            
            visited = []
            
            for (const { id } of this.entityManager.getEntitiesByComponents([ this.position, this.stats ])) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1)
            
            this.entityManager.entities[2].components = [ this.position, this.velocity, this.stats ]
            
            visited = []
            
            for (const { id } of this.entityManager.getEntitiesByComponents([ this.position, this.stats ])) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2)
            
            this.entityManager.entities[4].components = [ this.velocity ]
            
            visited = []
            
            for (const { id } of this.entityManager.getEntitiesByComponents([ this.position, this.stats ])) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2)
        })
    })
})