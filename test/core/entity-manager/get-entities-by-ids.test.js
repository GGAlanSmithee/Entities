import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('getEntitiesByIds(components = 0)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
            this.entityId = 5
             
            this.position = 'pos'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 'velocity'
            this.velocityComponent = 0.25
            
            this.stats = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = [ this.position, this.velocity, this.stats, ]
            this.entityManager._componentManager.components.set(this.position, this.positionComponent)
            this.entityManager._componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager._componentManager.components.set(this.stats, this.statsComponent)
            
            this.entityManager.entities[this.entityId].components = [ ...this.components, ]
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a generator function', () => {
            expect(this.entityManager.getEntitiesByIds).to.be.a('function')
        })
        
        test('returns an iterable of all entities in with id in [ids]', () => {
            const ids = [1, 2, 7, 4]

            const it = this.entityManager.getEntitiesByIds(ids)

            let i = 0
            let next = {}
            
            while ((next = it.next()).done !== true) {
                expect(next.value.id).to.equal(ids[i])

                ++i
            }

            expect(it.next()).property('value').to.be.undefined
        })

        test('returns an empty iterable when [ids] isn`t an array or an empty array', () => {
            const empty1 = this.entityManager.getEntitiesByIds()
            expect(empty1.next()).property('value').to.be.undefined

            const empty2 = this.entityManager.getEntitiesByIds([])
            expect(empty2.next()).property('value').to.be.undefined

            const empty3 = this.entityManager.getEntitiesByIds('')
            expect(empty3.next()).property('value').to.be.undefined

            const empty4 = this.entityManager.getEntitiesByIds(1)
            expect(empty4.next()).property('value').to.be.undefined

            const empty5 = this.entityManager.getEntitiesByIds(1.2)
            expect(empty5.next()).property('value').to.be.undefined

            const empty6 = this.entityManager.getEntitiesByIds({})
            expect(empty6.next()).property('value').to.be.undefined

            const empty7 = this.entityManager.getEntitiesByIds(undefined)
            expect(empty7.next()).property('value').to.be.undefined

            const empty8 = this.entityManager.getEntitiesByIds(null)
            expect(empty8.next()).property('value').to.be.undefined
        })
            
        test('for each iteration, returns an object containing the [entity] and its [id]', () => {
            let ids = [3, 4, 7, 9]

            let last = 0
            let i = 0
            for (let entity of this.entityManager.getEntitiesByIds(ids)) {
                expect(entity.id).to.equal(ids[i])
                expect(entity).to.deep.equal(this.entityManager.entities[ids[i]])
                last = entity.id
                ++i
            }
            
            expect(last).to.equal(9)
            
            last = 0
            i = 0
            for (let entity of this.entityManager.getEntitiesByIds(ids)) {
                expect(entity.id).to.equal(ids[i])
                expect(entity).to.deep.equal(this.entityManager.entities[ids[i]])
                last = entity.id
                ++i
            }
            
            expect(last).to.equal(9)

            ids = [3, 9, 4, 7]

            last = 0
            i = 0
            for (let entity of this.entityManager.getEntitiesByIds(ids)) {
                expect(entity.id).to.equal(ids[i])
                expect(entity).to.deep.equal(this.entityManager.entities[ids[i]])
                last = entity.id
                ++i
            }
            
            expect(last).to.equal(7)
        })

        test('skips ids that are out of range', () => {
            let ids = [
                -1,
                0,
                1,
                this.entityManager.entities.length-1,
                this.entityManager.entities.length,
                this.entityManager.entities.length+1
            ]

            let iteratedIds = []
            for (let { id } of this.entityManager.getEntitiesByIds(ids)) {
                iteratedIds.push(id)
            }

            expect(iteratedIds).property('length').to.equal(3)

            expect(iteratedIds).to.not.contain(-1)
            expect(iteratedIds).to.not.contain(this.entityManager.entities.length)
            expect(iteratedIds).to.not.contain(this.entityManager.entities.length+1)

            expect(iteratedIds).to.contain(0)
            expect(iteratedIds).to.contain(1)
            expect(iteratedIds).to.contain(this.entityManager.entities.length-1)
        })

        test('skips ids that isn´t an integer', () => {
            let ids = [
                'nanasd',
                0,
                1,
                1.2,
                [],
                this.entityManager.entities.length-1,
                {},
                function *() { yield 1 },
                null,
                undefined,
            ]

            let iteratedIds = []
            for (let { id } of this.entityManager.getEntitiesByIds(ids)) {
                iteratedIds.push(id)
            }

            expect(iteratedIds).property('length').to.equal(3)

            expect(iteratedIds).to.contain(0)
            expect(iteratedIds).to.contain(1)
            expect(iteratedIds).to.contain(this.entityManager.entities.length-1)
        })
    })
})