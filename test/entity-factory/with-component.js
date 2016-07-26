import { expect }        from 'chai'
import { EntityFactory } from '../../src/core/entity-factory'

describe('EntityFactory', function() {
    describe('withComponent(key, initializer)', () => {
        beforeEach(() => {
            this.entityFactory = new EntityFactory()
            
            this.position = 'position'
        })
        
        afterEach(() => {
            delete this.entityFactory
        })
        
        it('is a function', () => {
            expect(this.entityFactory.withComponent).to.be.a('function')
        })
        
        it('adds [key] and [initializer] to [configuration]', () => {
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            
            function initializer() {
                this.a = "A"
            }
            
            this.entityFactory.withComponent(this.position, initializer)
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
        })
        
        it('adds registered initializer as [initializer] when [initializer] is omitted or not a function', () => {
            function initializer() {
                this.a = "A"
            }
            
            this.entityFactory.initializers.set(this.position, initializer)
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position)
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
            
            this.entityFactory.configuration = new Map()
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, [])
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
            
            this.entityFactory.configuration = new Map()
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, 1)
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
            
            this.entityFactory.configuration = new Map()
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, 'not a function')
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
            
            this.entityFactory.configuration = new Map()
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position, null)
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.equal(initializer)
            
            this.entityFactory.configuration = new Map()
        })
        
        it('adds the [component] without a function [initializer] if [initializer] is omitted', () => {
            expect(this.entityFactory.configuration.has(this.position)).to.be.false
            this.entityFactory.withComponent(this.position)
            
            expect(this.entityFactory.configuration.has(this.position)).to.be.true
            expect(this.entityFactory.configuration.get(this.position)).to.be.undefined
        })
        
        it('does not add [component] to configuration if [component] is not a number', () => {
            expect(this.entityFactory).property('configuration').property('size').to.equal(0)
            
            this.entityFactory.withComponent()
            
            expect(this.entityFactory).property('configuration').property('size').to.equal(0)
        })
        
        it('returns this (the entityFactory instance)', () => {
            expect(this.entityFactory.withComponent(this.position)).to.equal(this.entityFactory)
        })
        
        it('returns this (the entityFactory instance) even if [component] is not registered (is invalid)', () => {
            expect(this.entityFactory.withComponent()).to.equal(this.entityFactory)
        })
    })
})