import { expect }           from 'chai'
import { ComponentManager } from '../../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('constructor()', () => {
        test('is a function', () => {
            expect(ComponentManager).to.be.a('function')
        })
        
        test('can be used to instantiate a [ComponentManager]', () => {
            let componentManager = new ComponentManager()
            
            expect(componentManager).to.be.an.instanceof(ComponentManager)
        })
        
        test('initializes [_components] to an empty Map', () => {
            let componentManager = new ComponentManager()
            
            expect(componentManager._components).to.be.an.instanceof(Map)
            expect(componentManager._components).property('size').to.equal(0)
        })
    })
})