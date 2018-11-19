import { expect }        from 'chai'
import { EntityFactory } from '../../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('withComponent(key, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 'pos'
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        test('is a function', () => {
            expect(this.entityFactory.withComponent).to.be.a('function')
        })
        
        test('adds [key] and [initializer] to [configuration]', () => {
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            
            function initializer() {
                this.a = "A"
            }
            
            this.entityFactory.withComponent(this.position, initializer)
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
        })
        
        test('adds registered initializer as [initializer] when [initializer] is omitted or not a function', () => {
            function initializer() {
                this.a = "A"
            }
            
            this.entityFactory._initializers.set(this.position, initializer)
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position)
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
            
            this.entityFactory._configuration.components = new Map()
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, [])
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
            
            this.entityFactory._configuration.components = new Map()
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, 1)
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
            
            this.entityFactory._configuration.components = new Map()
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, 'not a function')
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
            
            this.entityFactory._configuration.components = new Map()
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, null)
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.equal(initializer)
            
            this.entityFactory._configuration.components = new Map()
        })
        
        test('adds the [component] without a function [initializer] if [initializer] is omitted', () => {
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position)
            
            expect(this.entityFactory._configuration.components.has(this.position)).to.be.true
            expect(this.entityFactory._configuration.components.get(this.position)).to.be.undefined
        })
        
        test('does not add [component] to configuration if [component] is not a non-null string', () => {
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)
            
            this.entityFactory.withComponent('')
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)
            
            this.entityFactory.withComponent(0)
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)
            
            this.entityFactory.withComponent(-1)
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent(1)
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent(null)
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent()
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent(undefined)
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent([])
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)

            this.entityFactory.withComponent({})
            expect(this.entityFactory).property('_configuration').property('components').property('size').to.equal(0)
        })
        
        test('returns this (the entityFactory instance)', () => {
            expect(this.entityFactory.withComponent(this.position)).to.equal(this.entityFactory)
        })
        
        test('returns this (the entityFactory instance) even if [component] is not registered (is invalid)', () => {
            expect(this.entityFactory.withComponent()).to.equal(this.entityFactory)
        })
    })
})