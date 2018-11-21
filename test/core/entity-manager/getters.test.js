import { expect }          from 'chai'
import { EntityManager } from '../../../src/core/entity-manager'

describe('EntityManager', function() {
    beforeEach(() => {
        this.entityManager = new EntityManager(100)
    })
    
    afterEach(() => {
        delete this.entityManager
    })

    describe('components getter', () => {
        test('returns [_componentManager.components]', () => {
            let components = this.entityManager.components
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(0)
            expect(components).to.equal(this.entityManager._componentManager._components)
            
            const key = 'comp'
            
            this.entityManager.components.set(key, 10)
            
            components = this.entityManager.components
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(1)
            expect(components.get(key)).to.equal(10)
            expect(components).to.equal(this.entityManager._componentManager._components)
        })
    })

    describe('capacity getter', () => {
        test('returns [_entities.length]', () => {
            expect(this.entityManager.capacity).to.equal(100)
            
            this.entityManager._entities.length = 200
            expect(this.entityManager.capacity).to.equal(200)
        })
    })

    describe('entities getter', () => {
        test('returns [_entities]', () => {
            expect(this.entityManager.entities).to.deep.equal(this.entityManager._entities)
            
            this.entityManager._entities[10].components = [ 'Test' ]
            expect(this.entityManager.entities[10].components).to.deep.equal([ 'Test' ])
        })
    })

    describe('entityConfigurations getter', () => {
        test('returns [_entityConfigurations]', () => {
            expect(this.entityManager.entityConfigurations).to.deep.equal(this.entityManager._entityConfigurations)
            
            this.entityManager._entityConfigurations.set('Test', { value: 'testing' })
            expect(this.entityManager.entityConfigurations).to.deep.equal(this.entityManager._entityConfigurations)
            expect(this.entityManager.entityConfigurations.get('Test')).to.deep.equal({ value: 'testing' })
        })
    })
})