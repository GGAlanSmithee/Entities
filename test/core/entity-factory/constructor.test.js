import { expect }        from 'chai'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('constructor()', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(EntityFactory).to.be.a('function')
        })
        
        test('can be used to instantiate a new EntityFactory', () => {
            expect(this.entityFactory).to.be.an.instanceof(EntityFactory)
        })
        
        test('instantiates [_configuration] as an object containing [components] and [data]', () => {
            expect(this.entityFactory._configuration).to.be.an.instanceof(Object)
            expect(this.entityFactory._configuration).property('components').to.be.an.instanceof(Map)
            expect(this.entityFactory._configuration).property('data').to.be.an.instanceof(Object)
        })
        
        test('instantiates [_initializers] as a Map', () => {
            expect(this.entityFactory._initializers).to.be.an.instanceof(Map)
        })
    })
})