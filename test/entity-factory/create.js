import { expect }    from 'chai'
import EntityManager from '../../src/core/entity-manager'
import EntityFactory from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('create(entityManager, count = 1, configuration = undefined)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory(100)
            this.entityManager = new EntityManager()
            
            this.position = 'position'
            this.velocity = 'velocity'
            this.stats = 'stats'
            this.authentication = 'authentication'
            
            this.positionInitializer = function() {
                this.x = 4.0
                this.y = 4.0
            }
            
            this.velocityInitializer = () => 0.5
            
            this.statsInitializer = function() {
                this.strength = 100
                this.agility = 20
            }
            
            this.authenticationInitializer = () => 'authenticated'
            
            this.entityFactory.configuration.set(this.position, this.positionInitializer)
            this.entityFactory.configuration.set(this.velocity, this.velocityInitializer)
            this.entityFactory.configuration.set(this.stats, this.statsInitializer)
            this.entityFactory.configuration.set(this.authentication, this.authenticationInitializer)
            
            this.components = [ this.position, this.velocity, this.stats, this.authentication ]
            
            for (var entity of this.entityManager.entities) {
                entity[this.position] = { x : 1.0, y : 1.0 }
                entity[this.velocity] = 1.5
                entity[this.stats] = new function() { this.strength = 50; this.agility = 10 }
                entity[this.authentication] = 'not-authenticated'
            }
        })
        
        afterEach(() => {
            delete this.entityManager
            delete this.entityFactory
        })
        
        it('is a function', () => {
            expect(this.entityFactory.create).to.be.a('function')
        })
        
        it('adds an entity to the [entityManager] and returns an object containing the entity and its id', () => {
            let res = this.entityFactory.create(this.entityManager)
            
            expect(res.id).to.equal(0)
            
            res = this.entityFactory.create(this.entityManager)
            
            expect(res.id).to.equal(1)
            
            res = this.entityFactory.create(this.entityManager)
            
            expect(res.id).to.equal(2)
            
            this.entityManager.entities[1].components = []
            
            res = this.entityFactory.create(this.entityManager)
            
            expect(res.id).to.equal(1)
        })
        
        it('creates an entity according to the current [configuration]', () => {
            let { entity } = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.deep.equal(this.components)
            expect(entity[this.position]).property('x').to.equal(4.0)
            expect(entity[this.position]).property('y').to.equal(4.0)
            expect(entity[this.velocity]).to.equal(0.5)
            expect(entity[this.stats]).property('strength').to.equal(100)
            expect(entity[this.stats]).property('agility').to.equal(20)
            expect(entity[this.authentication]).to.equal('authenticated')
        })
        
        it('does not change a components value if there is no initializer for that component', () => {
            this.entityFactory.configuration.set(this.position, undefined)
            this.entityFactory.configuration.set(this.velocity, undefined)
            this.entityFactory.configuration.set(this.stats, undefined)
            this.entityFactory.configuration.set(this.authentication, undefined)
            
            let { entity } = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.deep.equal(this.components)
            expect(entity[this.position]).property('x').to.equal(1.0)
            expect(entity[this.position]).property('y').to.equal(1.0)
            expect(entity[this.velocity]).to.equal(1.5)
            expect(entity[this.stats]).property('strength').to.equal(50)
            expect(entity[this.stats]).property('agility').to.equal(10)
            expect(entity[this.authentication]).to.equal('not-authenticated')
        })
        
        it('creates an entity from a [configuration]', () => {
            let configuration = this.entityFactory.configuration
            
            this.entityFactory.configuration = new Map()
            
            let res = this.entityFactory.create(this.entityManager)
            
            expect(res.id).to.equal(0)
            expect(res.entity).property('components').to.be.an.instanceof(Array).and.to.be.empty
            
            res = this.entityFactory.create(this.entityManager, 1, configuration)

            expect(res.id).to.equal(0)

            expect(res.entity.components).to.deep.equal(this.components)
            expect(res.entity[this.position]).property('x').to.equal(4.0)
            expect(res.entity[this.position]).property('y').to.equal(4.0)
            expect(res.entity[this.velocity]).to.equal(0.5)
            expect(res.entity[this.stats]).property('strength').to.equal(100)
            expect(res.entity[this.stats]).property('agility').to.equal(20)
            expect(res.entity[this.authentication]).to.equal('authenticated')
        })
        
        it('creates [count] number of entities', () => {
            let count = Math.floor(Math.random() * 100)
            
            expect(this.entityFactory.create(this.entityManager, count)).property('length').to.equal(count)
        })
        
        it('creates [count] number of entities from [configuration]', () => {
            let configuration = this.entityFactory.configuration
            
            this.entityFactory.configuration = new Map()
            
            let count = Math.floor(Math.random() * 100)
            expect(this.entityFactory.create(this.entityManager, count, configuration)).property('length').to.equal(count)
        })
        
        it('creates up to [capacity] number of entities, even if [count] exceeds that', () => {
            for (let i = 0; i < this.entityManager.capacity - 5; ++i) {
                this.entityManager.entities[i].components = [ this.position, this.velocity ]
            }
            
            expect(this.entityFactory.create(this.entityManager, 10)).property('length').to.equal(5)
        })
        
        it('returns an empty array if [entityManager] is not an instance of EntityManager', () => {
            let entities = this.entityFactory.create()
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create(new Map())
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create([])
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create({})
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create(null)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create(1)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create('not a EntityManager instance.')
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
        })
    })
})