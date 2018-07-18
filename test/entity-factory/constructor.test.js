import { expect }        from 'chai'
import { EntityFactory } from '../../src/core/entity-factory'

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
        
        test('instantiates [configuration] as a Map', () => {
            expect(this.entityFactory.configuration).to.be.an.instanceof(Map)
        })
        
        test('instantiates [initializers] as a Map', () => {
            expect(this.entityFactory.initializers).to.be.an.instanceof(Map)
        })
    })
})