import { expect }        from 'chai'
import sinon             from 'sinon'
import { EventHandler }  from '../../../src/core/event-handler'
import { EntityManager } from  '../../../src/core/entity-manager'

describe('EventHandler', function() {
    describe('trigger()', () => {
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
            expect(this.eventHandler.trigger).to.be.a('function')
        })
        
        test('[callback] for the [event] is called with [args]', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            return this.eventHandler.trigger('onEvent', this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.true
                expect(spy.calledOn(this.eventHandler)).to.be.true
            })
        })
        
        test('[callback] is called with an EntityManager as [context]', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            const entityManager = new EntityManager()
            entityManager._eventHandler = this.eventHandler
            
            return this.eventHandler.trigger.call(entityManager, 'onEvent', this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.true
                expect(spy.calledOn(entityManager)).to.be.true
            })
        })
        
        test('returns an empty promise when [event] is not a string', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)

            return this.eventHandler.trigger([], this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
            })
        })
        
        test('returns an empty promise when [event] is not a string and [context] is an EntityManager', () => {
            const spy = sinon.spy()
            
            this.eventHandler._events.set('onEvent', new Map())
            this.eventHandler._events.get('onEvent').set(1, spy)
            
            const entityManager = new EntityManager()
            entityManager._eventHandler = this.eventHandler
            
            return this.eventHandler.trigger.call(entityManager, 1, this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
                expect(spy.calledOn(entityManager)).to.be.false
            })
        })
        
        test('returns an empty promise when entityManager does not have the [event] registered', () => {
            const spy = sinon.spy()

            return this.eventHandler.trigger('onEvent', this.params).then(() => {
                expect(spy.calledWith(this.params)).to.be.false
            })
        })
        
        test('returns an empty promise when no arguments are passed in', () => {
            const spy = sinon.spy()
            
            return this.eventHandler.trigger().then(() => {
                expect(spy.called).to.be.false
            })
        })
    })
})