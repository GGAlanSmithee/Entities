import { expect }           from 'chai'
import { ComponentManager } from '../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('newComponent(componentId)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager()
        })
        
        afterEach(() => {
            delete this.componentManager
        })
        
        test('is a function', () => {
            expect(this.componentManager.newComponent).to.be.a('function')
        })
        
        test('creates a new component from a function', () => {
            const key = 'comp'
            
            this.componentManager._components.set(key, function() { 
                this.x = 10.0
                this.y = 10.0
            })
            
            const component = this.componentManager.newComponent(key)
            
            expect(component).to.be.an('object')
            expect(component).to.have.property('x')
            expect(component).property('x').to.equal(10.0)
            expect(component).to.have.property('y')
            expect(component).property('y').to.equal(10.0)
            expect(component).to.not.have.property('z')
        })
        
        test('creates a new component from an object', () => {
            const key = 'comp'
            
            this.componentManager._components.set(key, { 
                x : 10.0,
                y : 10.0
            })
            
            const component = this.componentManager.newComponent(key)
            
            expect(component).to.be.an('object')
            expect(component).to.have.property('x')
            expect(component).property('x').to.equal(10.0)
            expect(component).to.have.property('y')
            expect(component).property('y').to.equal(10.0)
            expect(component).to.not.have.property('z')
        })
        
        test('creates a new component from an int', () => {
            const key = 'comp'
            
            this.componentManager._components.set(key, 5)
            
            let component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('number')
            expect(component).to.equal(5)
            
            this.componentManager._components.set(key, -10)
            
            component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('number')
            expect(component).to.equal(-10)
        })
        
        test('creates a new component from a float', () => {
            const key = 'comp'
            
            this.componentManager._components.set(key, 5.5)
            
            let component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('number')
            expect(Number.isInteger(component)).to.be.false
            expect(component).to.equal(5.5)
            expect(component).to.not.equal(5)
            
            this.componentManager._components.set(key, -20.5)
            
            component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('number')
            expect(Number.isInteger(component)).to.be.false
            expect(component).to.equal(-20.5)
            expect(component).to.not.equal(-20.0)
        })
        
        test('creates a new component from a string', () => {
            let key = 'comp'
            
            this.componentManager._components.set(key, 'test')
            
            let component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('string')
            expect(component).to.equal('test')
            
            this.componentManager._components.set(key, '')
            
            component = this.componentManager.newComponent(key)
            
            expect(component).to.be.a('string')
            expect(component).to.equal('')
        })
        
        test('returns null if a component has not been registered for the passed in [id]', () => {
            const key            = 'comp'
            const nonExistingKey = 'non-comp'
            
            this.componentManager._components.set(key, 'test')
            
            expect(this.componentManager.newComponent(nonExistingKey)).to.be.null
        })
            
        test('returns null on bad input', () => {
            expect(this.componentManager.newComponent()).to.be.null
            expect(this.componentManager.newComponent(null)).to.be.null
            expect(this.componentManager.newComponent(undefined)).to.be.null
            expect(this.componentManager.newComponent(1)).to.be.null
            expect(this.componentManager.newComponent(1.1)).to.be.null
            expect(this.componentManager.newComponent('')).to.be.null
            expect(this.componentManager.newComponent([])).to.be.null
            expect(this.componentManager.newComponent({})).to.be.null
            expect(this.componentManager.newComponent(new Map())).to.be.null
        })
    })
})