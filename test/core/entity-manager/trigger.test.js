import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('trigger()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.trigger).to.be.a('function')
        })
        
        test('invokes [eventHandler.trigger] with the correct parameters and the [entityManager] as the context (this)', () => {
            const event    = 'onEvent'
            const callback = function() { this.hi = 'hi' }
            
            this.entityManager.listen(event, callback)
            
            const spy = sinon.spy(this.entityManager.eventHandler, 'trigger')
            
            const params = {
                one: 'one',
                two: { name : 'test', age : 99 },
            }
            
            this.entityManager.trigger(event, params)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledOn(this.entityManager)).to.be.true
            expect(spy.calledWith(event, params)).to.be.true
        })
        
        test('returns a promise', () => {
            const event    = 'onEvent'
            const callback = function() { this.hi = 'hi' }
            
            this.entityManager.listen(event, callback)
            
            expect(this.entityManager.trigger(event)).to.be.an.instanceof(Promise)
        })
    })
})