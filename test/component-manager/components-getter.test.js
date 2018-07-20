import { expect }          from 'chai'
import { ComponentManager} from '../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('components', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager()
        })
        
        afterEach(() => {
            delete this.componentManager
        })

        test('returns [_components]', () => {
            let components = this.componentManager.components
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(0)
            expect(components).to.equal(this.componentManager._components)
            
            const key = 'comp'
            
            this.componentManager.components.set(key, 10)
            
            components = this.componentManager.components
            
            expect(components).to.be.an.instanceof(Map)
            expect(components).property('size').to.equal(1)
            expect(components.get(key)).to.equal(10)
            expect(components).to.equal(this.componentManager._components)
        })
    })
})