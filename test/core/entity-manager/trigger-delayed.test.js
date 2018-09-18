import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('triggerDelayed()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.triggerDelayed).to.be.a('function')
        })
        
        test('invokes [eventHandler.triggerDelayed] with the correct parameters and the [entityManager] as the context (this)', () => {
            const event    = 'onEvent'
            const callback = function() { this.hi = 'hi' }
            
            this.entityManager.listen(event, callback)
            
            const spy = sinon.spy(this.entityManager._eventHandler, 'triggerDelayed')
            
            const timeout  = 10
            const params = {
                one: 'one',
                two: { name : 'test', age : 99 },
            }
            
            this.entityManager.triggerDelayed(event, timeout, params)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledOn(this.entityManager)).to.be.true
            expect(spy.calledWith(event, timeout, params)).to.be.true
        })
        
        test('returns a promise', () => {
            const event    = 'onEvent'
            const callback = function() { this.hi = 'hi' }
            
            this.entityManager.listen(event, callback)
            
            expect(this.entityManager.triggerDelayed(event, 10)).to.be.an.instanceof(Promise)
        })
    })
})