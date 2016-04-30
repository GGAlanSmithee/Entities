import { expect }     from 'chai'
import sinon          from 'sinon'
import EntityManager  from '../../src/core/entity-manager'

describe('EntityManager', function() {
    describe('registerConfiguration(key)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })
        
        afterEach(() => {
            delete this.entityManager
        })
        
        it('is a function', () => {
            expect(this.entityManager.registerConfiguration).to.be.a('function')
        })
        
        it('invokes [entityFactory].createConfiguration', () => {
            let spy = sinon.spy(this.entityManager.entityFactory, 'createConfiguration')
            
            this.entityManager.registerConfiguration('conf')
            
            expect(spy.calledOnce).to.be.true
        })
        
        it('saves the created configuration in [entityConfigurations]', () => {
            let component   = this.position
            let initializer = function() { return 2 }
            
            this.entityManager.entityFactory.configuration.set(component, initializer)
            
            this.entityManager.registerConfiguration('conf')
            
            const configuration = this.entityManager.entityConfigurations.get('conf')
            
            expect(configuration).to.be.an.instanceof(Map)
            expect(configuration).property('size').to.equal(1)
            expect(configuration.get(component)).to.equal(initializer)
        })
        
        it('returns [key]', () => {
            let configuration = this.entityManager.registerConfiguration('conf')
            
            expect(configuration).to.equal('conf')
        })
        
        it('throws exception on bad [key]', () => {
            expect(() => this.entityManager.registerConfiguration()).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration(null)).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration('')).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration(1)).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration(1.2)).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration([])).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration({})).to.throw(TypeError, 'key must be a non empty string.')
            expect(() => this.entityManager.registerConfiguration(() => { })).to.throw(TypeError, 'key must be a non empty string.')
        })
    })
})