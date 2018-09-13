import { expect }        from 'chai'
import sinon             from 'sinon'
import { EventHandler }  from '../../../src/core/event-handler'
import { EntityManager } from  '../../../src/core/entity-manager'

describe('EventHandler', function() {
    describe('triggerDelayed(event, callback)', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler()

            this.params = {    
                one: 'hello',
                two: [ 1, 2, 3 ],
                three: { a : 'A' },
            }
        })
        
        afterEach(() => {
            delete this.eventHandler
        })
        
        test('is a function', () => {
            expect(this.eventHandler.triggerDelayed).to.be.a('function')
        })
        
        test('[callback] for the [event] is called with [args] after [timeout]', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            return this.eventHandler.triggerDelayed('onEvent', 10, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.true
                expect(spy.calledOn(this.eventHandler)).to.be.true
            })
        })
        
        test('[callback] is called with an EntityManager as [context] after [timeoute]', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            const entityManager = new EntityManager()
            entityManager._eventHandler = this.eventHandler
            
            return this.eventHandler.triggerDelayed.call(entityManager, 'onEvent', 10, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.true
                expect(spy.calledOn(entityManager)).to.be.true
            })
        })
        
        test('returns an empty promise when [event] is not a string', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            return this.eventHandler.triggerDelayed([], 10, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
            })
        })
        
        test('returns an empty promise when [event] is not a string and [context] is an EntityManager', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            const entityManager = new EntityManager()
            entityManager._eventHandler = this.eventHandler
            
            return this.eventHandler.triggerDelayed.call(entityManager, 10, 1, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
                expect(spy.calledOn(entityManager)).to.be.false
            })
        })
        
        test('returns an empty promise when entityManager does not have the [event] registered', () => {
            const spy = sinon.spy()

            return this.eventHandler.triggerDelayed('onEvent', 10, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
            })
        })
        
        test('returns an empty promise when [timeout] is not an integer', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            return this.eventHandler.triggerDelayed('onEvent', 'not an integer', this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
            })
        })
        
        test('returns an empty promise when no arguments are passed in', () => {
            const spy = sinon.spy()
            
            return this.eventHandler.triggerDelayed().then(() => {
                expect(spy.called).to.be.false
            })
        })
    })
})