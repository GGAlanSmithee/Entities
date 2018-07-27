import { expect } from 'chai'
import { isNonEmptyStringMsg } from '../../../src/validate/is-non-empty-string'
import { alreadyContainsMsg } from '../../../src/validate/already-contains'
import { isDefinedMsg } from '../../../src/validate/is-defined'
import { ComponentManager } from '../../../src/core/component-manager'

describe('ComponentManager', function() {
    describe('registerComponent(component)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager()
        })
        
        afterEach(() => {
            delete this.componentManager
        })
        
        test('is a function', () => {
            expect(this.componentManager.registerComponent).to.be.a('function')
        })
        
        test('succesfully registers components of different types, given valid input', () => {
            const compKey1 = 'comp1'
            const comp1 = 1

            const compKey2 = 'comp2'
            const comp2 = 'hello'

            const compKey3 = 'comp3'
            const comp3 = { x: 1, y: 2, }

            const compKey4 = 'comp4'
            const comp4 = 1.6

            expect(this.componentManager.components).to.be.empty
            expect(this.componentManager.components.has(compKey1)).to.be.false
            expect(this.componentManager.components.has(compKey2)).to.be.false
            expect(this.componentManager.components.has(compKey3)).to.be.false
            expect(this.componentManager.components.has(compKey4)).to.be.false

            this.componentManager.registerComponent(compKey1, comp1)

            expect(this.componentManager.components).to.not.be.empty
            expect(this.componentManager.components.has(compKey1)).to.be.true
            expect(this.componentManager.components.has(compKey2)).to.be.false
            expect(this.componentManager.components.has(compKey3)).to.be.false
            expect(this.componentManager.components.has(compKey4)).to.be.false
            expect(this.componentManager.components.get(compKey1)).to.deep.equal(comp1)

            this.componentManager.registerComponent(compKey2, comp2)

            expect(this.componentManager.components).to.not.be.empty
            expect(this.componentManager.components.has(compKey1)).to.be.true
            expect(this.componentManager.components.has(compKey2)).to.be.true
            expect(this.componentManager.components.has(compKey3)).to.be.false
            expect(this.componentManager.components.has(compKey4)).to.be.false
            expect(this.componentManager.components.get(compKey2)).to.deep.equal(comp2)

            this.componentManager.registerComponent(compKey3, comp3)

            expect(this.componentManager.components).to.not.be.empty
            expect(this.componentManager.components.has(compKey1)).to.be.true
            expect(this.componentManager.components.has(compKey2)).to.be.true
            expect(this.componentManager.components.has(compKey3)).to.be.true
            expect(this.componentManager.components.has(compKey4)).to.be.false
            expect(this.componentManager.components.get(compKey3)).to.deep.equal(comp3)

            this.componentManager.registerComponent(compKey4, comp4)

            expect(this.componentManager.components).to.not.be.empty
            expect(this.componentManager.components.has(compKey1)).to.be.true
            expect(this.componentManager.components.has(compKey2)).to.be.true
            expect(this.componentManager.components.has(compKey3)).to.be.true
            expect(this.componentManager.components.has(compKey4)).to.be.true
            expect(this.componentManager.components.get(compKey4)).to.deep.equal(comp4)
        })

        test('gives an error when [key] isn´t a string or empty', () => {
            const msg = (value = '') => isNonEmptyStringMsg('key', value)

            expect(() => this.componentManager.registerComponent(undefined, 1)).to.throw(TypeError, msg(undefined))
            expect(() => this.componentManager.registerComponent(null, 1)).to.throw(TypeError, msg(null))
            expect(() => this.componentManager.registerComponent('', 1)).to.throw(TypeError, msg(''))
            expect(() => this.componentManager.registerComponent(1, 1)).to.throw(TypeError, msg(1))
            expect(() => this.componentManager.registerComponent(1.1, 1)).to.throw(TypeError, msg(1.1))
            expect(() => this.componentManager.registerComponent([], 1)).to.throw(TypeError, msg([]))
            expect(() => this.componentManager.registerComponent({}, 1)).to.throw(TypeError, msg({}))
            expect(() => this.componentManager.registerComponent(new Map(), 1)).to.throw(TypeError, msg(new Map()))
        })

        test('gives an error when [component] = null or omitted', () => {
            const msg = (value = '') => isDefinedMsg('component', value)

            expect(() => this.componentManager.registerComponent('comp')).to.throw(TypeError, msg())
            expect(() => this.componentManager.registerComponent('comp', null)).to.throw(TypeError, msg(null))
            expect(() => this.componentManager.registerComponent('comp', undefined)).to.throw(TypeError, msg(undefined))
        })
        
        test('gives an error when a component with [key] is already registed', () => {
            const msg = (key = '') => alreadyContainsMsg(key, 'components')

            this.componentManager.registerComponent('comp', 1)
            this.componentManager.registerComponent('comp1', 2.5)
            
            expect(() => this.componentManager.registerComponent('comp', 2)).to.throw(Error, msg('comp'))
            expect(() => this.componentManager.registerComponent('comp', {})).to.throw(Error, msg('comp'))
            
            this.componentManager.registerComponent('comp2', {})

            expect(() => this.componentManager.registerComponent('comp2', 1)).to.throw(Error, msg('comp2'))
            expect(() => this.componentManager.registerComponent('comp1', {})).to.throw(Error, msg('comp1'))
        })
    })
})