import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('stopListen(eventId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

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
})