import { expect }        from 'chai'
import { ComponentManager } from '../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('unregisterComponent(componentId)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager()
            
            this.pos = 1
            this.posName = 'pos'
            this.posComponent = function() { this.x = 10; this.y = 20 }
            
            this.componentManager.components.set(this.pos, this.posComponent)
        })
        
        afterEach(() => {
            delete this.componentManager
        })
        
        it('is a function', () => {
            expect(this.componentManager.unregisterComponent).to.be.a('function')
        })
        
        it('removes a previously registered component', () => {
            expect(this.componentManager.components.get(this.pos)).to.equal(this.posComponent)
            
            this.componentManager.unregisterComponent(this.pos)
            
            expect(this.componentManager.components.get(this.pos)).to.be.undefined
        })
        
        it('does nothin, given the wrong [componentId]', () => {
            expect(this.componentManager.components.get(this.pos)).to.equal(this.posComponent)
            
            this.componentManager.unregisterComponent(this.pos+1)
            
            expect(this.componentManager.components.get(this.pos)).to.equal(this.posComponent)
        })
        
        it('returns true when succesfully removing a component', () => {
            expect(this.componentManager.unregisterComponent(this.pos)).to.be.true
        })
        
        it('returns false when attemting to remove a component that is not registered', () => {
            expect(this.componentManager.unregisterComponent(this.pos+1)).to.be.false
        })
        
        it('throws an error if [componentId] is not an positive integer', () => {
            expect(() => { this.componentManager.unregisterComponent() }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent(0) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent('0') }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent('') }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent('not a postive integer') }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent(-1) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent(1.2) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent(null) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent(undefined) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent([]) }).to.throw(TypeError, 'componentId must be a number over 0.')
            expect(() => { this.componentManager.unregisterComponent({}) }).to.throw(TypeError, 'componentId must be a number over 0.')
        })
    })
})