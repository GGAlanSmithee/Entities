import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('removeSystem(systemId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })

        test('is a function', () => {
            expect(this.entityManager.removeSystem).to.be.a('function')
        })
        
        test('invokes [systemManager.removeSystem] with the correct parameters', () => {
            const system = 'movement'
            
            const spy = sinon.spy(this.entityManager.systemManager, 'removeSystem')
            
            this.entityManager.removeSystem(system)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(system)).to.be.true
        })
    })
})