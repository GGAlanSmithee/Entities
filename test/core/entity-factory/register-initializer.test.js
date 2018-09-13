import { expect } from 'chai'
import { isNonEmptyStringMsg } from '../../../src/validate/is-non-empty-string'
import { isFunctionMsg } from '../../../src/validate/is-function'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('registerInitializer(component, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 'one'
            this.velocity = 'two'
            this.stats    = 'three'
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.registerInitializer).to.be.a('function')
        })
        
        test('registers an initializer', () => {
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            this.entityFactory.registerInitializer(this.position, () => { })
            
            expect(this.entityFactory._initializers.size).to.equal(1)
            
            this.entityFactory.registerInitializer(this.velocity, () => { })
            
            expect(this.entityFactory._initializers.size).to.equal(2)
            
            this.entityFactory.registerInitializer(this.position, () => { })
            
            expect(this.entityFactory._initializers.size).to.equal(2)
            
            this.entityFactory.registerInitializer(this.stats, () => { })
            
            expect(this.entityFactory._initializers.size).to.equal(3)
        })
        
        test('throws error if [key] is not a non-empty string', () => {
            const msg = (value = '') => isNonEmptyStringMsg('key', value)
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(undefined, () => { })).to.throw(TypeError, msg(undefined))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(null, () => { })).to.throw(TypeError, msg(null))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(1, () => { })).to.throw(TypeError, msg(1))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(1.2, () => { })).to.throw(TypeError, msg(1.2))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer([], () => { })).to.throw(TypeError, msg([]))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer({}, () => { })).to.throw(TypeError, msg({}))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer('', () => { })).to.throw(TypeError, msg(''))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(0, () => { })).to.throw(TypeError, msg(0))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(-1, () => { })).to.throw(TypeError, msg(-1))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
        })
        
        test('throws error if [initializer] is not a function', () => {

            const msg = (value = '') => isFunctionMsg('initializer', value)

            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position)).to.throw(TypeError, msg())
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, undefined)).to.throw(TypeError, msg(undefined))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, null)).to.throw(TypeError, msg(null))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, [])).to.throw(TypeError, msg([]))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, {})).to.throw(TypeError, msg({}))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 'not a function')).to.throw(TypeError, msg('not a function'))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 1)).to.throw(TypeError, msg(1))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
            
            expect(() => this.entityFactory.registerInitializer(this.position, 1.2)).to.throw(TypeError, msg(1.2))
            
            expect(this.entityFactory._initializers.size).to.equal(0)
        })
    })
})