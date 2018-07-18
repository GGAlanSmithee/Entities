import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../src/core/entity-manager'

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
            test('is a function', () => {
                expect(this.entityManager.registerInitializer).to.be.a('function')
            })
            
            test('invokes [entityFactory].registerInitializer with the corrent arguments', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')
                
                const component = this.position
                const initializer = function() {
                    this.x = 10.0
                }
                
                this.entityManager.registerInitializer(component, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(component, initializer)).to.be.true
            })
            
            test('invokes [entityFactory].registerInitializer with the corrent component id, given a component name', () => {
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
            test('is a function', () => {
                expect(this.entityManager.build).to.be.a('function')
            })
            
            test('invokes [entityFactory].build', () => {
                const spy = sinon.spy(this.entityManager.entityFactory, 'build')
                
                this.entityManager.build()
                
                expect(spy.calledOnce).to.be.true
            })
            
            test('returns the [entityManager] instance to allow for method chaining', () => {
                const entityManager = this.entityManager.build()
                
                expect(entityManager).to.equal(this.entityManager)
            })
        })
        
        describe('withComponent(componentId, initializer)', () => {
            test('is a function', () => {
                expect(this.entityManager.withComponent).to.be.a('function')
            })
            
            test('invokes [entityFactory].withComponent with [component] and [initializer]', () => {
                const component   = this.position
                const initializer = function() { return 2 }
                
                const spy = sinon.spy(this.entityManager.entityFactory, 'withComponent')
                
                this.entityManager.withComponent(component, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(component, initializer)).to.be.true
            })
            
            test('invokes [entityFactory].withComponent with the correct component id, given a component name', () => {
                const initializer = function() { return 2 }
                
                const spy = sinon.spy(this.entityManager.entityFactory, 'withComponent')
                
                this.entityManager.withComponent(this.positionName, initializer)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(this.position, initializer)).to.be.true
            })
            
            test('returns the [entityManager] instance to allow for method chaining', () => {
                const entityManager = this.entityManager.withComponent(1)
                
                expect(entityManager).to.equal(this.entityManager)
            })
        })

        describe('removeSystem(systemId)', () => {
            test('is a function', () => {
                expect(this.entityManager.removeSystem).to.be.a('function')
            })
            
            test('invokes [systemManager.removeSystem] with the correct parameters', () => {
                const system = 'movement'
                
                const spy = sinon.spy(this.entityManager.systemManager, 'removeSystem')
                
                this.entityManager.removeSystem(system)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(system)).to.be.true
            })
        })
        
        describe('listen(event, callback)', () => {
            test('is a function', () => {
                expect(this.entityManager.listen).to.be.a('function')
            })
            
            test('invokes [eventHandler.listen] with the correct parameters', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'listen')
                
                this.entityManager.listen(event, callback)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(event, callback)).to.be.true
            })
            
            test('returns the id of the added event', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                expect(this.entityManager.listen(event, callback)).to.equal(0)
                expect(this.entityManager.listen(event, callback)).to.equal(1)
            })
        })
        
        describe('stopListen(eventId)', () => {
            test('is a function', () => {
                expect(this.entityManager.stopListen).to.be.a('function')
            })
            
            test('invokes [eventHandler.stopListen] with the correct parameters', () => {
                const eventId = 1
                
                const spy = sinon.spy(this.entityManager.eventHandler, 'stopListen')
                
                this.entityManager.stopListen(eventId)
                
                expect(spy.calledOnce).to.be.true
                expect(spy.calledWith(eventId)).to.be.true
            })
            
            test('returns true when there was an event to stop listen to, and false when not', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                const eventId = this.entityManager.listen(event, callback)
                
                expect(this.entityManager.stopListen(eventId)).to.be.true
                expect(this.entityManager.stopListen(eventId)).to.be.false
            })
        })
        
        describe('trigger()', () => {
            test('is a function', () => {
                expect(this.entityManager.trigger).to.be.a('function')
            })
            
            test('invokes [eventHandler.trigger] with the correct parameters and the [entityManager] as the context (this)', () => {
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
            
            test('returns a promise', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                expect(this.entityManager.trigger(event)).to.be.an.instanceof(Promise)
            })
        })
        
        describe('triggerDelayed()', () => {
            test('is a function', () => {
                expect(this.entityManager.triggerDelayed).to.be.a('function')
            })
            
            test('invokes [eventHandler.triggerDelayed] with the correct parameters and the [entityManager] as the context (this)', () => {
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
            
            test('returns a promise', () => {
                const event    = 'onEvent'
                const callback = function() { this.hi = 'hi' }
                
                this.entityManager.listen(event, callback)
                
                expect(this.entityManager.triggerDelayed(event, 10)).to.be.an.instanceof(Promise)
            })
        })
    })
})