import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('withComponent(componentId, initializer)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager() 
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.withComponent).to.be.a('function')
        })
        
        test('invokes [entityFactory].withComponent with [component] and [initializer]', () => {
            const initializer = function() { return 2 }
            
            const spy = sinon.spy(this.entityManager._entityFactory, 'withComponent')
            
            this.entityManager.withComponent('position', initializer)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith('position', initializer)).to.be.true
        })
        
        test('returns the [entityManager] instance to allow for method chaining', () => {
            const entityManager = this.entityManager.withComponent(1)
            
            expect(entityManager).to.equal(this.entityManager)
        })
    })
})