import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('newEntity(components)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager(100)
            
            this.position = 'position'
            this.positionComponent = { x : 1, y : 1, z : -2 }
            
            this.velocity = 'velocity'
            this.velocityComponent = 0.25
            
            this.stats = 'stats'
            this.statsComponent = { xp : 10000, level : 20 }
            
            this.components = [ this.position, this.velocity, this.stats ]
            this.entityManager._componentManager.components.set(this.position, this.positionComponent)
            this.entityManager._componentManager.components.set(this.velocity, this.velocityComponent)
            this.entityManager._componentManager.components.set(this.stats, this.statsComponent)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.newEntity).to.be.a('function')
        })
        
        test('adds and returns an object containing an entity, given correct [components] input', () => {
            let entity = this.entityManager.newEntity(this.components)
            
            expect(entity.id).to.equal(0)
            expect(entity).to.deep.equal(this.entityManager.entities[entity.id])
            
            entity = this.entityManager.newEntity(this.components)
            
            expect(entity.id).to.equal(1)
            expect(entity).to.deep.equal(this.entityManager.entities[entity.id])
        })

        test('correctly creates an entity given an array not containing all registered components', () => {
            const components = [ this.position, this.stats ]

            let entity = this.entityManager.newEntity(components)
            
            expect(entity.id).to.equal(0)
            expect(entity).to.deep.equal(this.entityManager.entities[entity.id])
            
            entity = this.entityManager.newEntity(components)
            
            expect(entity.id).to.equal(1)
            expect(entity).to.deep.equal(this.entityManager.entities[entity.id])
            expect(entity.components).to.deep.equal([ this.position, this.stats, ])
            expect(entity.data).to.deep.equal({})
        })
        
        test('does not add an entity and returns null, given invalid [components] input', () => {
            let entity = this.entityManager.newEntity()
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity('not an array')
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity('')
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(null)
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(undefined)
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(0)
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(1)
            expect(entity).to.be.null

            entity = this.entityManager.newEntity(-1)
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity('1')
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(1.5)
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity({})
            expect(entity).to.be.null
        })
        
        test('sets the [components] property of entities[entityId] to equal the passed in [components]', () => {
            expect(this.entityManager.entities[0].components).to.deep.equal([])
            
            let entity = this.entityManager.newEntity(this.components)
            
            expect(entity.id).to.equal(0)
            expect(this.entityManager.entities[entity.id].components).to.deep.equal(this.components)
            expect(entity.components).to.deep.equal(this.components)
            expect(entity.data).to.deep.equal({})

            entity = this.entityManager.newEntity([ this.stats ])
            
            expect(entity.id).to.equal(1)
            expect(this.entityManager.entities[entity.id].components).to.deep.equal([ this.stats, ])
            expect(entity.components).to.deep.equal([ this.stats, ])
            expect(entity.data).to.deep.equal({})

            entity = this.entityManager.newEntity([ this.position, this.stats ])
            
            expect(entity.id).to.equal(2)
            expect(this.entityManager.entities[entity.id].components).to.deep.equal([ this.position, this.stats ])
            expect(entity.components).to.deep.equal([ this.position, this.stats ])
            expect(entity.data).to.deep.equal({})

            entity = this.entityManager.newEntity(this.components)
            
            expect(entity.id).to.equal(3)
            expect(this.entityManager.entities[entity.id].components).to.deep.equal(this.components)
            expect(entity.components).to.deep.equal(this.components)
            expect(entity.data).to.deep.equal({})

            this.entityManager.entities[2].components = []

            entity = this.entityManager.newEntity([ this.position ])
            
            expect(entity.id).to.equal(2)
            expect(this.entityManager.entities[entity.id].components).to.deep.equal([ this.position ])
            expect(entity.components).to.deep.equal([ this.position ])
            expect(entity.data).to.deep.equal({})
        })
        
        test('returns null and does not add an entity if there is no more space in the entityManager', () => {
            for (let i = 0; i < this.entityManager.capacity; ++i) {
                this.entityManager.newEntity([ this.position ])
            }
            
            let entity = this.entityManager.newEntity([ this.position, ])
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity([ this.position, ])
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity([ this.position, this.stats, ])
            expect(entity).to.be.null
            
            entity = this.entityManager.newEntity(this.velocity)
            expect(entity).to.be.null
        })
    })
})