import { expect }          from 'chai'
import { ComponentManager} from '../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('getComponents()', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager()
        })
        
        afterEach(() => {
            delete this.componentManager
        })
        
        test('is a function', () => {
            expect(this.componentManager.getComponents).to.be.a('function')
        })
        
        test('returns [components]', () => {
            let components = this.componentManager.getComponents()
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(0)
            expect(components).to.equal(this.componentManager.components)
            
            const id = 1
            
            this.componentManager.components.set(id, 10)
            
            components = this.componentManager.getComponents()
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(1)
            expect(components.get(id)).to.equal(10)
            expect(components).to.equal(this.componentManager.components)
        })
    })
})