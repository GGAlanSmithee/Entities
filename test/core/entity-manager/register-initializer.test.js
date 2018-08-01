import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerInitializer(component, initializer)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.registerInitializer).to.be.a('function')
        })
        
        test('invokes [entityFactory].registerInitializer with the corrent arguments', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'registerInitializer')

            const initializer = function() {
                this.x = 10.0
            }
            
            this.entityManager.registerInitializer('position', initializer)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith('position', initializer)).to.be.true
        })
    })
})