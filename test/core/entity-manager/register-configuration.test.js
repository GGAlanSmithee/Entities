import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerConfiguration()', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        test('is a function', () => {
            expect(this.entityManager.registerConfiguration).to.be.a('function')
        })
        
        test('invokes [entityFactory].createConfiguration', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'createConfiguration')
            
            this.entityManager.registerConfiguration('conf')
            
            expect(spy.calledOnce).to.be.true
        })
        
        test('saves the created configuration in [entityConfigurations]', () => {
            let component   = 1
            let initializer = function() { return 2 }
            
            this.entityManager.entityFactory._configuration.set(component, initializer)
            
            let conf = this.entityManager.registerConfiguration()
            
            const configuration = this.entityManager.entityConfigurations.get(conf)
            
            expect(configuration).to.be.an.instanceof(Map)
            expect(configuration).property('size').to.equal(1)
            expect(configuration.get(component)).to.equal(initializer)
        })
        
        test('returns [id]', () => {
            const id = this.entityManager.registerConfiguration()
            
            expect(id).to.equal(1)
        })
    })
})