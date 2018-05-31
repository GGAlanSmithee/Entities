import { expect }        from 'chai'
import { EntityFactory } from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('registerInitializer(component, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 1
            this.velocity = 2
            this.stats    = 4
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.registerInitializer).to.be.a('function')
        })
        
        test('registers an initializer', () => {
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            this.entityFactory.registerInitializer(this.position, () => { })
            
            expect(this.entityFactory.initializers.size).to.equal(1)
            
            this.entityFactory.registerInitializer(this.velocity, () => { })
            
            expect(this.entityFactory.initializers.size).to.equal(2)
            
            this.entityFactory.registerInitializer(this.position, () => { })
            
            expect(this.entityFactory.initializers.size).to.equal(2)
            
            this.entityFactory.registerInitializer(this.stats, () => { })
            
            expect(this.entityFactory.initializers.size).to.equal(3)
        })
        
        test('throws error if [componentId] is not a posetive integer', () => {
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(undefined, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(null, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer('1', () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(1.2, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer([], () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer({}, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer('', () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(0, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(-1, () => { })).to.throw(TypeError, 'id must be a posetive integer.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
        })
        
        test('throws error if [initializer] is not a function', () => {
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position)).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, undefined)).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, null)).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, [])).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, {})).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 'not a function')).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 1)).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 1.2)).to.throw(TypeError, 'initializer must be a function.')
            
            expect(this.entityFactory.initializers.size).to.equal(0)
        })
    })
})