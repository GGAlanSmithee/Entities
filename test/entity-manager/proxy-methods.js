import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'
import { SystemType }    from '../../src/core/system-manager'

describe('EntityManager', function() {
    describe('proxy methods', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
            
            this.position = 1
            this.positionName = 'position'
            
            this.velocity = 2
            this.velocityName = 'velocity'
            
            this.stats = 4
            this.statsName = 'stats'
            
            this.entityManager.componentLookup.set(this.positionName, this.position)
            this.entityManager.componentLookup.set(this.velocityName, this.velocity)
            this.entityManager.componentLookup.set(this.statsName, this.stats)
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        describe('registerInitializer(component, initializer)', () => {
            it('is a function', () => {
                expect(this.entityManager.registerInitializer).to.be.a('function')
            })
            
            it('invokes [entityFactory].registerInitializer with the corrent arguments', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
                
                const component = this.position
                const initializer = function() {
                    this.x = 10.0
                }
                
                this.entityManager.registerInitializer(component, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(component, initializer)).to.be.true
            })
            
            it('invokes [entityFactory].registerInitializer with the corrent component id, given a component name', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
                
                const initializer = function() {
                    this.x = 10.0
                }
                
                this.entityManager.registerInitializer(this.positionName, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(this.position, initializer)).to.be.true
            })
        })
        
        describe('build', () => {
            it('is a function', () => {
                expect(this.entityManager.build).to.be.a('function')
            })
            
            it('invokes [entityFactory].build', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'build')
                
                this.entityManager.build()
                
                expect(spy.calledOnce).to.be.true
            })
            
            it('returns the [entityManager] instance to allow for method chaining', () => {
                const entityManager = this.entityManager.build()
                
                expect(entityManager).to.equal(this.entityManager)
            })
        })
        
        describe('withComponent(componentId, initializer)', () => {
            it('is a function', () => {
                expect(this.entityManager.withComponent).to.be.a('function')
            })
            
            it('invokes [entityFactory].withComponent with [component] and [initializer]', () => {
                const component   = this.position
                const initializer = function() { return 2 }
                
                const spy = sinon.spy(this.entityManager.entityFactory, 'withComponent')
                
                this.entityManager.withComponent(component, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(component, initializer)).to.be.true
            })
            
            it('invokes [entityFactory].withComponent with the correct component id, given a component name', () => {
                const initializer = function() { return 2 }
                
                const spy = sinon.spy(this.entityManager.entityFactory, 'withComponent')
                
                this.entityManager.withComponent(this.positionName, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(this.position, initializer)).to.be.true
            })
            
            it('returns the [entityManager] instance to allow for method chaining', () => {
                const entityManager = this.entityManager.withComponent(1)
                
                expect(entityManager).to.equal(this.entityManager)
            })
        })
        
        describe('create(count, configurationId)', () => {
            it('is a function', () => {
                expect(this.entityManager.create).to.be.a('function')
            })
            
            it('invokes [entityFactory].create', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'create')
                
                this.entityManager.create()
                
                expect(spy.calledOnce).to.be.true
            })
            
            it('invokes [entityFactory].create with [entityManager] (this), [count] and the configuration corresponding to [id]', () => {
                const component   = this.position
                const initializer = function() { return 2 }
                
                const id = 1
                
                const configuration = new Map()
                configuration.set(component, initializer)
                
                this.entityManager.entityConfigurations.set(id, configuration)
                
                const spy = sinon.spy(this.entityManager.entityFactory, 'create')
                
                const count = 3
                
                this.entityManager.create(count, id)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(this.entityManager, count, configuration)).to.be.true
            })
            
            it('returns the created entities as an object containing { id, entity }', () => {
                const component   = this.position
                const initializer = function() { return 2 }
                
                const id = 1
                const configuration = new Map()
                configuration.set(component, initializer)
                
                this.entityManager.entityConfigurations.set(id, configuration)
                
                const count = 2
                
                const entities = this.entityManager.create(count, id)
                
                expect(entities).to.be.an.instanceof(Array)
                expect(entities).property('length').to.equal(2)
                expect(entities[0].entity.components).to.deep.equal(component)
                expect(entities[1].entity.components).to.deep.equal(component)
            })
            
            it('throws exception if a [configurationId] is supplied that doesn\'t correspond to a configuration [entityConfigurations]', () => {
                const msg = 'Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.'
                
                expect(() => this.entityManager.create(1, 1)).to.throw(Error, msg)
                expect(() => this.entityManager.create(1)).to.not.throw(Error, msg)
            })
        })
         
        describe('registerSystem(callback, components, type = SystemType.Logic)', () => {
            it('is a function', () => {
                expect(this.entityManager.registerSystem).to.be.a('function')
            })
            
            it('invokes [systemManager.registerSystem] with the correct parameters', () => {
                const type       = SystemType.Render
                const components = this.position | this.velocity | this.stats
                
                const callback = function(entities, { delta }) { 
                    for (const { entity } of entities) {
                        entity.position += entity.velocity * delta
                    }
                }
                
                const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
                
                const systemId = this.entityManager.registerSystem(type, components, callback)

                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(type, components, callback)).to.be.true
                expect(systemId).to.equal(1)
            })
            
            it('invokes [systemManager.registerSystem] with the correct component ids, given component names', () => {
                const type           = SystemType.Render
                const components     = this.position | this.velocity | this.stats
                const componentNames = [ this.positionName, this.velocityName, this.statsName ]
                
                const callback = function(entities, { delta }) { 
                    for (const { entity } of entities) {
                        entity.position += entity.velocity * delta
                    }
                }
                
                const spy = sinon.spy(this.entityManager.systemManager, 'registerSystem')
                
                const systemId = this.entityManager.registerSystem(type, componentNames, callback)

                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(type, components, callback)).to.be.true
                expect(systemId).to.equal(1)
            })
        })
        
        describe('removeSystem(systemId)', () => {
            it('is a function', () => {
                expect(this.entityManager.removeSystem).to.be.a('function')
            })
            
            it('invokes [systemManager.removeSystem] with the correct parameters', () => {
                const system = 'movement'
                
                const spy = sinon.spy(this.entityManager.systemManager, 'removeSystem')
                
                this.entityManager.removeSystem(system)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(system)).to.be.true
            })
        })
        
        describe('listen(event, callback)', () => {
            it('is a function', () => {
                expect(this.entityManager.listen).to.be.a('function')
            })
            
            it('invokes [eventHandler.listen] with the correct parameters', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'listen')
                
                this.entityManager.listen(event, callback)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(event, callback)).to.be.true
            })
            
            it('returns the id of the added event', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                expect(this.entityManager.listen(event, callback)).to.equal(0)
                expect(this.entityManager.listen(event, callback)).to.equal(1)
            })
        })
        
        describe('stopListen(eventId)', () => {
            it('is a function', () => {
                expect(this.entityManager.stopListen).to.be.a('function')
            })
            
            it('invokes [eventHandler.stopListen] with the correct parameters', () => {
                const eventId = 1
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'stopListen')
                
                this.entityManager.stopListen(eventId)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(eventId)).to.be.true
            })
            
            it('returns true when there was an event to stop listen to, and false when not', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                const eventId = this.entityManager.listen(event, callback)
                
                expect(this.entityManager.stopListen(eventId)).to.be.true
                expect(this.entityManager.stopListen(eventId)).to.be.false
            })
        })
        
        describe('trigger()', () => {
            it('is a function', () => {
                expect(this.entityManager.trigger).to.be.a('function')
            })
            
            it('invokes [eventHandler.trigger] with the correct parameters and the [entityManager] as the context (this)', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'trigger')
                
                const paramOne = 'one'
                const paramTwo = { name : 'test', age : 99 }
                
                this.entityManager.trigger(event, paramOne, paramTwo)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledOn(this.entityManager)).to.be.true
                expect(spy.calledWith(event, paramOne, paramTwo)).to.be.true
            })
            
            it('returns a promise', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                return expect(this.entityManager.trigger(event)).to.be.an.instanceof(Promise)
            })
        })
        
        describe('triggerDelayed()', () => {
            it('is a function', () => {
                expect(this.entityManager.triggerDelayed).to.be.a('function')
            })
            
            it('invokes [eventHandler.triggerDelayed] with the correct parameters and the [entityManager] as the context (this)', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'triggerDelayed')
                
                const timeout  = 10
                const paramOne = 'one'
                const paramTwo = { name : 'test', age : 99 }
                
                this.entityManager.triggerDelayed(event, timeout, paramOne, paramTwo)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledOn(this.entityManager)).to.be.true
                expect(spy.calledWith(event, timeout, paramOne, paramTwo)).to.be.true
            })
            
            it('returns a promise', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                return expect(this.entityManager.triggerDelayed(event, 10)).to.be.an.instanceof(Promise)
            })
        })
    })
})