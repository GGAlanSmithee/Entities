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
            const id = 1
            
            this.componentManager.components.set(id, function() { 
                this.x = 10.0
                this.y = 10.0
            })
            
            const component = this.componentManager.newComponent(id)
            
            expect(component).to.be.an('object')
            expect(component).to.have.property('x')
            expect(component).property('x').to.equal(10.0)
            expect(component).to.have.property('y')
            expect(component).property('y').to.equal(10.0)
            expect(component).to.not.have.property('z')
        })
        
        test('creates a new component from an object', () => {
            const id = 1
            
            this.componentManager.components.set(id, { 
                x : 10.0,
                y : 10.0
            })
            
            const component = this.componentManager.newComponent(id)
            
            expect(component).to.be.an('object')
            expect(component).to.have.property('x')
            expect(component).property('x').to.equal(10.0)
            expect(component).to.have.property('y')
            expect(component).property('y').to.equal(10.0)
            expect(component).to.not.have.property('z')
        })
        
        test('creates a new component from an int', () => {
            const id = 1
            
            this.componentManager.components.set(id, 5)
            
            let component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('number')
            expect(component).to.equal(5)
            
            this.componentManager.components.set(id, -10)
            
            component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('number')
            expect(component).to.equal(-10)
        })
        
        test('creates a new component from a float', () => {
            const id = 1
            
            this.componentManager.components.set(id, 5.5)
            
            let component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('number')
            expect(Number.isInteger(component)).to.be.false
            expect(component).to.equal(5.5)
            expect(component).to.not.equal(5)
            
            this.componentManager.components.set(id, -20.5)
            
            component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('number')
            expect(Number.isInteger(component)).to.be.false
            expect(component).to.equal(-20.5)
            expect(component).to.not.equal(-20.0)
        })
        
        test('creates a new component from a string', () => {
            let id = 1
            
            this.componentManager.components.set(id, 'test')
            
            let component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('string')
            expect(component).to.equal('test')
            
            this.componentManager.components.set(id, '')
            
            component = this.componentManager.newComponent(id)
            
            expect(component).to.be.a('string')
            expect(component).to.equal('')
        })
        
        test('returns null if a component has not been registered for the passed in [id]', () => {
            const id            = 1
            const nonExistingId = 2
            
            this.componentManager.components.set(id, 'test')
            
            expect(this.componentManager.newComponent(nonExistingId)).to.be.null
        })
            
        test('returns null on bad input', () => {
            let component = this.componentManager.newComponent()
            
            expect(component).to.be.null
            
            component = this.componentManager.newComponent(null)
            
            expect(component).to.be.null
            
            component = this.componentManager.newComponent(undefined)
            
            expect(component).to.be.null
        })
    })
})