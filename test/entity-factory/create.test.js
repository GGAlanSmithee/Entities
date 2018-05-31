import { expect }        from 'chai'
import { EntityManager } from '../../src/core/entity-manager'
import { EntityFactory } from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('create(entityManager, count = 1, configuration = undefined)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            this.entityManager = new EntityManager()
            
            this.componentOne   = 1
            this.componentTwo   = 2
            this.componentThree = 8
            this.componentFour  = 32
            
            this.componentOneInitializer   = function() { this.x = 4.0 }
            this.componentTwoInitializer   = function() { this.y = 5.0 }
            this.componentThreeInitializer = () => { return 15 }
            this.componentFourInitializer  = () => { return "Full Name" }
            
            this.entityFactory.configuration.set(this.componentOne, this.componentOneInitializer)
            this.entityFactory.configuration.set(this.componentTwo, this.componentTwoInitializer)
            this.entityFactory.configuration.set(this.componentThree, this.componentThreeInitializer)
            this.entityFactory.configuration.set(this.componentFour, this.componentFourInitializer)
            
            this.components = this.componentOne | this.componentTwo | this.componentThree | this.componentFour
            
            for (let entity of this.entityManager.entities) {
                entity[this.componentOne] = new (function() { this.x = 1.0 })()
                entity[this.componentTwo] = { y : 2.0 }
                entity[this.componentThree] = 1
                entity[this.componentFour] = 'Name'
            }
        })
        
        afterEach(() => {
            delete this.entityManager
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.create).to.be.a('function')
        })
        
        test('creates an entity according to the current [configuration]', () => {
            const {entity} = this.entityFactory.create(this.entityManager)
            
            expect(entity.components).to.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(4.0)
            expect(entity[this.componentTwo]).property('y').to.equal(5.0)
            expect(entity[this.componentThree]).to.equal(this.componentThreeInitializer())
            expect(entity[this.componentFour]).to.equal(this.componentFourInitializer())
        })
        
        test('does not change a components value if there is no initializer for that component', () => {
            this.entityFactory.configuration.set(this.componentOne, undefined)
            this.entityFactory.configuration.set(this.componentTwo, undefined)
            this.entityFactory.configuration.set(this.componentThree, undefined)
            this.entityFactory.configuration.set(this.componentFour, undefined)
            
            const {entity} = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(1.0)
            expect(entity[this.componentTwo]).property('y').to.equal(2.0)
            expect(entity[this.componentThree]).to.equal(1)
            expect(entity[this.componentFour]).to.equal("Name")
        })
        
        test('creates an entity from a [configuration]', () => {
            let configuration = this.entityFactory.configuration
            
            this.entityFactory.configuration = new Map()
            
            let entities = this.entityFactory.create(this.entityManager)
            
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            const {entity} = this.entityFactory.create(this.entityManager, 1, configuration)

            expect(entity).to.be.an.instanceof(Object)

            expect(entity.components).to.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(4.0)
            expect(entity[this.componentTwo]).property('y').to.equal(5.0)
            expect(entity[this.componentThree]).to.equal(this.componentThreeInitializer())
            expect(entity[this.componentFour]).to.equal(this.componentFourInitializer())
        })
        
        test('creates [count] number of entities', () => {
            const count = Math.floor(Math.random() * 100)
            
            expect(this.entityFactory.create(this.entityManager, count)).property('length').to.equal(count)
        })
        
        test('creates [count] number of entities from [configuration]', () => {
            const configuration = this.entityFactory.configuration
            
            this.entityFactory.configuration = new Map()
            
            const count = Math.floor(Math.random() * 100)
            
            expect(this.entityFactory.create(this.entityManager, count, configuration)).property('length').to.equal(count)
        })
        
        test('returns an empty array if [entityManager] is not an instance of EntityManager', () => {
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