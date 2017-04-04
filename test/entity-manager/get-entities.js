import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('getEntities(components = 0)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            this.entityManager.currentMaxEntity = 20
            
            this.entityId = 5
            
            this.position = 1
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 2
            this.velocityComponent = 0.25
            
            this.stats = 4
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = this.position | this.velocity | this.stats
            this.entityManager.componentManager.components.set(this.position, this.positionComponent)
            this.entityManager.componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager.componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.entities[this.entityId].components = this.components
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a generator function', () => {
            expect(this.entityManager.getEntities).to.be.a('generatorFunction')
        })
        
        it('returns an iterable of all entities up to [currentMaxEntity]', () => {
            this.entityManager.currentMaxEntity = 20
            
            let it = this.entityManager.getEntities()
            
            let res = {}
            let next = {}
            
            while ((next = it.next()).done !== true) {
                res = next
            }
            
            expect(res.value.id).to.equal(this.entityManager.currentMaxEntity).and.to.equal(20)
            
            expect(it.next()).property('value').to.be.undefined
        })
            
        it('for each iteration, returns an object containing the [entity] and its [id]', () => {
            this.entityManager.currentMaxEntity = 20
            
            let last = 0
            let i = 0
            for (let { id, entity } of this.entityManager.getEntities()) {
                expect(id).to.equal(i)
                expect(entity).to.deep.equal(this.entityManager.entities[i])
                last = id;
                ++i
            }
            
            expect(last).to.equal(this.entityManager.currentMaxEntity)
            
            last = 0
            i = 0
            for (let { id, entity } of this.entityManager.getEntities()) {
                expect(id).to.equal(i)
                expect(entity).to.deep.equal(this.entityManager.entities[i])
                last = id;
                ++i
            }
            
            expect(last).to.equal(this.entityManager.currentMaxEntity)
        })
        
        it('when called with [components], only returns entities that has [components]', () => {
            let visited = []
            
            for (let { id } of this.entityManager.getEntities(this.position | this.stats)) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1)
            
            this.entityManager.entities[2].components = this.position | this.velocity
            
            visited = []
            
            for (let { id } of this.entityManager.getEntities(this.position | this.stats)) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.property('length').to.equal(1)
            
            this.entityManager.entities[2].components = this.position | this.velocity | this.stats
            
            visited = []
            
            for (let { id } of this.entityManager.getEntities(this.position | this.stats)) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2)
            
            this.entityManager.entities[4].components = this.velocity
            
            visited = []
            
            for (let { id } of this.entityManager.getEntities(this.position | this.stats)) {
                visited.push(id)
            }
            
            expect(visited).to.contain(this.entityId).and.to.contain(2).and.property('length').to.equal(2)
        })
    })
})