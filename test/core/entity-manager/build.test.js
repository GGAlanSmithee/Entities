import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('build', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.build).to.be.a('function')
        })
        
        test('invokes [entityFactory].build', () => {
            const spy = sinon.spy(this.entityManager._entityFactory, 'build')
            
            this.entityManager.build()
            
            expect(spy.calledOnce).to.be.true
        })
        
        test('returns the [entityManager] instance to allow for method chaining', () => {
            const entityManager = this.entityManager.build()
            
            expect(entityManager).to.equal(this.entityManager)
        })
    })
})