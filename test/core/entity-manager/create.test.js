import { expect }        from 'chai'
import sinon             from 'sinon'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    
    describe('create(count, configurationId)', () => {
        beforeEach(() => {
            this.entityManager = new EntityManager()
        })

        test('is a function', () => {
            expect(this.entityManager.create).to.be.a('function')
        })
        
        test('invokes [entityFactory].create', () => {
            const spy = sinon.spy(this.entityManager.entityFactory, 'create')
            
            this.entityManager.create()
            
            expect(spy.calledOnce).to.be.true
        })
        
        test('invokes [entityFactory].create with [entityManager] as the context (this), [count] and the configuration corresponding to [id]', () => {
            const component   = this.position
            const initializer = function() { return 2 }
            
            const id = 1
            
            const configuration = new Map()
            configuration.set(component, initializer)
            
            this.entityManager.entityConfigurations.set(id, configuration)
            
            const spy = sinon.spy(this.entityManager.entityFactory, 'create')
            
            const count = 3
            
            this.entityManager.create(count, id)
            
            expect(spy.calledOnce).to.be.true
            expect(spy.calledWith(this.entityManager, count, configuration)).to.be.true
        })
        
        test('returns the created entities as an object containing { id, entity }', () => {
            const component   = this.position
            const initializer = function() { return 2 }
            
            const id = 1
            const configuration = new Map()
            configuration.set(component, initializer)
            
            this.entityManager.entityConfigurations.set(id, configuration)
            
            const count = 2
            
            const entities = this.entityManager.create(count, id)
            
            expect(entities).to.be.an.instanceof(Array)
            expect(entities).property('length').to.equal(2)
            expect(entities[0].components).to.deep.equal([component])
            expect(entities[1].components).to.deep.equal([component])
        })
        
        test('throws exception if a [configurationId] is supplied that doesn\'t correspond to a configuration [entityConfigurations]', () => {
            const msg = 'Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.'
            
            expect(() => this.entityManager.create(1, 1)).to.throw(Error, msg)
            expect(() => this.entityManager.create(1)).to.not.throw(Error, msg)
        })

        test('throws exception if a [configurationId] is supplied that doesn\'t correspond to a configuration [entityConfigurations]', () => {
            const msg = 'Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.'
            
            expect(() => this.entityManager.create(1, 1)).to.throw(Error, msg)
            expect(() => this.entityManager.create(1)).to.not.throw(Error, msg)
        })

        test('throws exception if a [configurationId] is supplied that is not null, undefined or a positive integer', () => {
            const msg = 'configurationId should be an integer if using a save configuration, or undefined if not.'
            
            expect(() => this.entityManager.create(1, -1)).to.throw(Error, msg)
            expect(() => this.entityManager.create(1, 1.2)).to.throw(Error, msg)
            expect(() => this.entityManager.create(1, '1')).to.throw(Error, msg)
            expect(() => this.entityManager.create(1, [])).to.throw(Error, msg)
            expect(() => this.entityManager.create(1, {})).to.throw(Error, msg)
            expect(() => this.entityManager.create(1, new Map())).to.throw(Error, msg)
        })
    })
})