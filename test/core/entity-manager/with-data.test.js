import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('withData(data)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager() 
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.withData).to.be.a('function')
        })
        
        test('invokes [entityFactory].withData with [data]', () => {
            const data = { myValue: 2 }
            
            const spy = sinon.spy(this.entityManager._entityFactory, 'withData')
            
            this.entityManager.withData(data)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(data)).to.be.true
        })
        
        test('returns the [entityManager] instance to allow for method chaining', () => {
            const entityManager = this.entityManager.withData(1)
            
            expect(entityManager).to.equal(this.entityManager)
        })
    })
})