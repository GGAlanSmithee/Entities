import { expect }        from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'
import { EntityFactory } from '../../../src/core/entity-factory'
import { isDefinedMsg } from '../../../src/validate/is-defined'
import { isMapMsg } from '../../../src/validate/is-map'
import { isObjectMsg } from '../../../src/validate/is-object'

describe('EntityFactory', function() {
    describe('create(entityManager, count = 1, configuration = undefined)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            this.entityManager = new EntityManager()
            
            this.componentOne   = 'one'
            this.componentTwo   = 'two'
            this.componentThree = 'three'
            this.componentFour  = 'four'
            
            this.componentOneInitializer   = (c) => ({ ...c, x: 4.0, })
            this.componentTwoInitializer   = (c) => ({ ...c, y: 5.0, })
            this.componentThreeInitializer = () => 15
            this.componentFourInitializer  = () => "Full Name"

            this.entityFactory._configuration.components.set(this.componentOne, this.componentOneInitializer)
            this.entityFactory._configuration.components.set(this.componentTwo, this.componentTwoInitializer)
            this.entityFactory._configuration.components.set(this.componentThree, this.componentThreeInitializer)
            this.entityFactory._configuration.components.set(this.componentFour, this.componentFourInitializer)

            this.data = { value: 'entity data from entity factory' }
            this.entityFactory._configuration.data = this.data
            
            this.components = [
                this.componentOne,
                this.componentTwo,
                this.componentThree,
                this.componentFour
            ]

            for (let entity of this.entityManager.entities) {
                entity[this.componentOne] = new (function() { this.x = 1.0 })()
                entity[this.componentTwo] = { y : 2.0 }
                entity[this.componentThree] = 1
                entity[this.componentFour] = 'Name'
                entity.data = {
                    value: 'default entity data',
                    valueToBeRemoved: 'I should be overwritten and removed',
                }
            }
        })
        
        afterEach(() => {
            delete this.entityManager
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.create).to.be.a('function')
        })
        
        test('creates an entity according to the current [_configuration]', () => {
            const [entity] = this.entityFactory.create(this.entityManager)
            
            expect(entity.data).to.deep.equal(this.data)
            expect(entity.components).to.deep.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(4.0)
            expect(entity[this.componentTwo]).property('y').to.equal(5.0)
            expect(entity[this.componentThree]).to.equal(this.componentThreeInitializer())
            expect(entity[this.componentFour]).to.equal(this.componentFourInitializer())
        })
        
        test('does not change a components value if there is no initializer for that component', () => {
            this.entityFactory._configuration.components.set(this.componentOne, undefined)
            this.entityFactory._configuration.components.set(this.componentTwo, undefined)
            this.entityFactory._configuration.components.set(this.componentThree, undefined)
            this.entityFactory._configuration.components.set(this.componentFour, undefined)
            
            const [entity] = this.entityFactory.create(this.entityManager)

            expect(entity.data).to.deep.equal(this.data)
            expect(entity.components).to.deep.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(1.0)
            expect(entity[this.componentTwo]).property('y').to.equal(2.0)
            expect(entity[this.componentThree]).to.equal(1)
            expect(entity[this.componentFour]).to.equal('Name')
        })
        
        test('creates an entity from a [configuration]', () => {
            const configuration = { ...this.entityFactory._configuration, }
            
            this.entityFactory._configuration = null
            
            const [entity] = this.entityFactory.create(this.entityManager, 1, configuration)

            expect(entity).to.be.an.instanceof(Object)

            expect(entity.data).to.deep.equal(this.data)
            expect(entity.components).to.deep.equal(this.components)
            expect(entity[this.componentOne]).property('x').to.equal(4.0)
            expect(entity[this.componentTwo]).property('y').to.equal(5.0)
            expect(entity[this.componentThree]).to.equal(this.componentThreeInitializer())
            expect(entity[this.componentFour]).to.equal(this.componentFourInitializer())
        })

        test('succesfully initializes a component which is a class without providing a initializer', () => {
            const testComp = 'classCompTest'

            class TestComponent {
                constructor(x, y) {
                    this.x = x
                    this.y = y
                }

                x = 0
                y = 0
            }

            for (const entity of this.entityManager.entities) {
                entity[testComp] = new TestComponent(5, 5)
            }

            this.entityFactory._configuration = {
                components: new Map(),
                data: { }
            }

            this.entityFactory._configuration.components.set(testComp)

            const [entity] = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.deep.equal([testComp])
            expect(entity[testComp]).to.deep.equal(new TestComponent(5, 5))
        })

        test('succesfully initializes a component which is a class when providing a initializer', () => {
            const testComp = 'classCompTest'

            class TestComponent {
                constructor(x, y) {
                    this.x = x
                    this.y = y
                }

                x = 0
                y = 0
            }

            for (const entity of this.entityManager.entities) {
                entity[testComp] = new TestComponent(5, 5)
            }

            this.entityFactory._configuration = {
                components: new Map(),
                data: { }
            }

            this.entityFactory._configuration.components.set(testComp, () => new TestComponent(10, 10))

            const [entity] = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.deep.equal([testComp])
            expect(entity[testComp]).to.deep.equal(new TestComponent(10, 10))
        })

        test('skips component initialization and uses default values if a initializer which does not return a value was provided', () => {
            const testComp = 'classCompTest'

            class TestComponent {
                constructor(x, y) {
                    this.x = x
                    this.y = y
                }

                x = 0
                y = 0
            }

            for (const entity of this.entityManager.entities) {
                entity[testComp] = new TestComponent(5, 5)
            }

            this.entityFactory._configuration = {
                components: new Map(),
                data: { }
            }

            this.entityFactory._configuration.components.set(testComp, () => { /* does not return a value */ })

            const [entity] = this.entityFactory.create(this.entityManager)

            expect(entity.components).to.deep.equal([testComp])
            expect(entity[testComp]).to.deep.equal(new TestComponent(5, 5))
        })
        
        test('does not create an entity without a [configuration] since components are empty', () => {
            this.entityFactory._configuration = {
                components: new Map(),
                data: {},
            }
            
            const entities = this.entityFactory.create(this.entityManager, 1)

            expect(entities).to.an.instanceOf(Array).and.to.be.empty
        })
        
        test('creates an entity with an empty [data] object if none was set', () => {
            this.entityFactory._configuration = {
                ...this.entityFactory._configuration,
                data: {},
            }

            const [entity] = this.entityFactory.create(this.entityManager, 1)

            expect(entity).to.be.an.instanceof(Object)
            
            expect(entity.data).to.deep.equal({})
            expect(entity.components).to.deep.equal(this.components)
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
            const configuration = { ...this.entityFactory._configuration, }
            
            this.entityFactory._configuration = {
                components: new Map(),
                data: {}
            }
            
            const count = Math.floor(Math.random() * 100)
            
            expect(this.entityFactory.create(this.entityManager, count, configuration)).property('length').to.equal(count)
        })

        test('throws and error if both [configuration] and [_configuration] isn\'t defined', () => {
            const msg = (value = '') => isDefinedMsg('configuration', value)
            
            this.entityFactory._configuration = null

            expect(() => this.entityFactory.create(this.entityManager, 1)).to.throw(TypeError, msg(null))
            expect(() => this.entityFactory.create(this.entityManager, 1, null)).to.throw(TypeError, msg(null))
            expect(() => this.entityFactory.create(this.entityManager, 1, undefined)).to.throw(TypeError, msg(null))
        })

        test('throws and error if [configuration.components] isn´t a map', () => {
            const msg = (value = '') => isMapMsg('configuration.components', value)
            
            const configuration = { ...this.entityFactory._configuration }

            this.entityFactory._configuration = null

            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: {}, })).to.throw(TypeError, msg({}))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: [], })).to.throw(TypeError, msg([]))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: '', })).to.throw(TypeError, msg(''))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: 1, })).to.throw(TypeError, msg(1))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: 1.5, })).to.throw(TypeError, msg(1.5))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: null, })).to.throw(TypeError, msg(null))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, components: undefined, })).to.throw(TypeError, msg(undefined))
        })

        test('throws and error if [configuration.data] isn´t an object', () => {
            const msg = (value = '') => isObjectMsg('configuration.data', value)
            
            const configuration = { ...this.entityFactory._configuration }

            this.entityFactory._configuration = null

            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: new Map(), })).to.throw(TypeError, msg(new Map()))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: [], })).to.throw(TypeError, msg([]))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: '', })).to.throw(TypeError, msg(''))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: 1, })).to.throw(TypeError, msg(1))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: 1.5, })).to.throw(TypeError, msg(1.5))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: null, })).to.throw(TypeError, msg(null))
            expect(() => this.entityFactory.create(this.entityManager, 1, { ...configuration, data: undefined, })).to.throw(TypeError, msg(undefined))
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

        test('returns an empty array if there are no more available entities in the [entityManager]', () => {
            let entities = this.entityFactory.create(this.entityManager, this.entityManager.capacity - 2)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(this.entityManager.capacity - 2)

            entities = this.entityFactory.create(this.entityManager, 1)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(1)

            entities = this.entityFactory.create(this.entityManager, 1)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(1)

            entities = this.entityFactory.create(this.entityManager, 1)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
            
            entities = this.entityFactory.create(this.entityManager, 1)
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(0)
        })
    })
})