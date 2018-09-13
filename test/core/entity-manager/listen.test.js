import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('listen(event, callback)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
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
})