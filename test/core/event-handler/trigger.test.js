import { expect }        from 'chai'
import sinon             from 'sinon'
import { EventHandler }  from '../../../src/core/event-handler'
import { EntityManager } from  '../../../src/core/entity-manager'

describe('EventHandler', function() {
    describe('trigger()', () => {
        beforeEach(() => {
            this.eventHandler = new EventHandler()
        })
        
        afterEach(() => {
            delete this.eventHandler
        })
        
        test('is a function', () => {
            expect(this.eventHandler.trigger).to.be.a('function')
        })
        
        test('[callback] for the [event] is called with [args]', () => {
            let spy = sinon.spy()
            
            this.eventHandler.events.set('onEvent', new Map())
            this.eventHandler.events.get('onEvent').set(1, spy)
            
            let paramOne = 'hello'
            let paramTwo = [ 1, 2, 3 ]
            let paramThree = { a : 'A' }
            
            return this.eventHandler.trigger('onEvent', paramOne, paramTwo, paramThree).then(() => {
                expect(spy.calledWith(paramOne, paramTwo, paramThree)).to.be.true
                expect(spy.calledOn(this.eventHandler)).to.be.true
            })
        })
        
        test('[callback] is called with an EntityManager as [context]', () => {
            let spy = sinon.spy()
            
            this.eventHandler.events.set('onEvent', new Map())
            this.eventHandler.events.get('onEvent').set(1, spy)
            
            let paramOne = 'hello'
            let paramTwo = [ 1, 2, 3 ]
            let paramThree = { a : 'A' }
            
            let entityManager = new EntityManager()
            entityManager.eventHandler = this.eventHandler
            
            return this.eventHandler.trigger.call(entityManager, 'onEvent', paramOne, paramTwo, paramThree).then(() => {
                expect(spy.calledWith(paramOne, paramTwo, paramThree)).to.be.true
                expect(spy.calledOn(entityManager)).to.be.true
            })
        })
        
        test('returns an empty promise when [event] is not a string', () => {
            let spy = sinon.spy()
            
            this.eventHandler.events.set('onEvent', new Map())
            this.eventHandler.events.get('onEvent').set(1, spy)
            
            let paramOne = 'hello'
            let paramTwo = [ 1, 2, 3 ]
            let paramThree = { a : 'A' }
            
            return this.eventHandler.trigger([], paramOne, paramTwo, paramThree).then(() => {
                expect(spy.calledWith(paramOne, paramTwo, paramThree)).to.be.false
            })
        })
        
        test('returns an empty promise when [event] is not a string and [context] is an EntityManager', () => {
            let spy = sinon.spy()
            
            this.eventHandler.events.set('onEvent', new Map())
            this.eventHandler.events.get('onEvent').set(1, spy)
            
            let paramOne = 'hello'
            let paramTwo = [ 1, 2, 3 ]
            let paramThree = { a : 'A' }
            
            let entityManager = new EntityManager()
            entityManager.eventHandler = this.eventHandler
            
            return this.eventHandler.trigger.call(entityManager, 1, paramOne, paramTwo, paramThree).then(() => {
                expect(spy.calledWith(paramOne, paramTwo, paramThree)).to.be.false
                expect(spy.calledOn(entityManager)).to.be.false
            })
        })
        
        test('returns an empty promise when entityManager does not have the [event] registered', () => {
            let spy = sinon.spy()
            
            let paramOne = 'hello'
            let paramTwo = [ 1, 2, 3 ]
            let paramThree = { a : 'A' }
            
            return this.eventHandler.trigger('onEvent', paramOne, paramTwo, paramThree).then(() => {
                expect(spy.calledWith(paramOne, paramTwo, paramThree)).to.be.false
            })
        })
        
        test('returns an empty promise when no arguments are passed in', () => {
            let spy = sinon.spy()
            
            return this.eventHandler.trigger().then(() => {
                expect(spy.called).to.be.false
            })
        })
    })
})