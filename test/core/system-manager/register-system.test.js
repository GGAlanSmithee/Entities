import { expect }                    from 'chai'
import sinon                         from 'sinon'
import { SystemManager, SystemType } from '../../../src/core/system-manager'

describe('SystemManager', function() {
    describe('registerSystem(type, components, callback)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()
        })
        
        afterEach(() => {
            delete this.systemManager
        })

        test('is a function', () => {
            expect(this.systemManager.registerSystem).to.be.a('function')
        })
        
        test('adds a system under the correct type', () => {
            expect(this.systemManager.logicSystems).property('size').to.equal(0)
            expect(this.systemManager.renderSystems).property('size').to.equal(0)
            expect(this.systemManager.initSystems).property('size').to.equal(0)
            
            const components = [ 'one', 'two' ]

            this.systemManager.registerSystem(SystemType.Logic, 'movement', components, [], () => { })
            this.systemManager.registerSystem(SystemType.Render, 'rendering', components, [], () => { })
            this.systemManager.registerSystem(SystemType.Init, 'setup', components, [], () => { })
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1)
            expect(this.systemManager.renderSystems).property('size').to.equal(1)
            expect(this.systemManager.initSystems).property('size').to.equal(1)
        })
        
        test('registeres a system with the correct [components], [entities] and [callback]', () => {
            const spy = sinon.spy()
            const components = [ 'one', 'two' ]
            const entities = [ 1, 2, 3, ]
            
            const systemName = 'collision'
            
            this.systemManager.registerSystem(SystemType.Logic, systemName, components, entities, spy)
            
            const system = this.systemManager.logicSystems.get(systemName)
            
            expect(system).property('components').to.equal(components)
            expect(system).property('entities').to.equal(entities)
            
            system.callback()
            
            expect(system.callback.calledOnce).to.be.true
        })
        
        test('throws error if [type] is not a valid SystemType', () => {
            const components = [ 'one', 'two' ]

            const msg = (value = '') => `"type" must be one of 0, 1, 2. Got "${value}".`.trim()

            expect(() => { this.systemManager.registerSystem(3, 'sys', components, [], () => { }) }).to.throw(TypeError, msg(3))
            expect(() => { this.systemManager.registerSystem('hi', 'sys', components, [], () => { }) }).to.throw(TypeError, msg('hi'))
            expect(() => { this.systemManager.registerSystem('1', 'sys', components, [], () => { }) }).to.throw(TypeError, msg('1'))
            expect(() => { this.systemManager.registerSystem(-1, 'sys', components, [], () => { }) }).to.throw(TypeError, msg(-1))
            expect(() => { this.systemManager.registerSystem(1.5, 'sys', components, [], () => { }) }).to.throw(TypeError, msg(1.5))
            expect(() => { this.systemManager.registerSystem([], 'sys', components, [], () => { }) }).to.throw(TypeError, msg([]))
            expect(() => { this.systemManager.registerSystem({}, 'sys', components, [], () => { }) }).to.throw(TypeError, msg({}))
            expect(() => { this.systemManager.registerSystem(null, 'sys', components, [], () => { }) }).to.throw(TypeError, msg(null))
        })

        test('throws error if [key] is not a non-empty string.', () => {
            const components = [ 'one', 'two' ]

            const msg = (value = '') => `"key" must be a non-empty string. Got "${value}".`.trim()

            expect(() => { this.systemManager.registerSystem(SystemType.Logic, '', components, [], () => { }) }).to.throw(TypeError, msg(''))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, {}, components, [], () => { }) }).to.throw(TypeError, msg({}))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, [], components, [], () => { }) }).to.throw(TypeError, msg([]))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 1, components, [], () => { }) }).to.throw(TypeError, msg(1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 1.5, components, [], () => { }) }).to.throw(TypeError, msg(1.5))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, -1, components, [], () => { }) }).to.throw(TypeError, msg(-1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, new Map(), components, [], () => { }) }).to.throw(TypeError, msg(new Map()))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, null, components, [], () => { }) }).to.throw(TypeError, msg(null))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, undefined, components, [], () => { }) }).to.throw(TypeError, msg(undefined))
        })
        
        test('throws error if [components] is not an array', () => {
            const msg = (value = '') => `"components" must be an array. Got "${typeof value}".`.trim()

            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', 'components', [], () => { }) }).to.throw(TypeError, msg('components'))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', 1, [], () => { }) }).to.throw(TypeError, msg(1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', 1.5, [], () => { }) }).to.throw(TypeError, msg(1.5))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', {}, [], () => { }) }).to.throw(TypeError, msg({}))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', null, [], () => { }) }).to.throw(TypeError, msg(null))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', undefined, [], () => { }) }).to.throw(TypeError, msg(undefined))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', new Map(), [], () => { }) }).to.throw(TypeError, msg(new Map()))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', new Set(), [], () => { }) }).to.throw(TypeError, msg(new Set()))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', '', [], () => { }) }).to.throw(TypeError, msg(''))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', { components: [], }, [], () => { }) }).to.throw(TypeError, msg({ components: [], }))
        })
        
        test('throws error if [entities] is not an array', () => {
            const components = [ 'one', 'two' ]
            const msg = (value = '') => `"entities" must be an array. Got "${typeof value}".`.trim()

            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, {}, () => { }) }).to.throw(TypeError, msg({}))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, 1, () => { }) }).to.throw(TypeError, msg(1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, 1.5, () => { }) }).to.throw(TypeError, msg(1.5))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, '', () => { }) }).to.throw(TypeError, msg(''))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, -1, () => { }) }).to.throw(TypeError, msg(-1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, null, () => { }) }).to.throw(TypeError, msg(null))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, undefined, () => { }) }).to.throw(TypeError, msg(undefined))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, 'entities', () => { }) }).to.throw(TypeError, msg('entities'))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, new Map(), () => { }) }).to.throw(TypeError, msg(new Map()))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, new Set(), () => { }) }).to.throw(TypeError, msg(new Set()))
        })

        test('throws error if [callback] is not a function', () => {
            const components = [ 'one', 'two' ]
            const msg = (value = '') => `"callback" must be a function. Got "${typeof value}".`.trim()

            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], { }) }).to.throw(TypeError, msg({ }))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], []) }).to.throw(TypeError, msg([]))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], '') }).to.throw(TypeError, msg(''))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], 1) }).to.throw(TypeError, msg(1))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], 1.5) }).to.throw(TypeError, msg(1.5))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], null) }).to.throw(TypeError, msg(null))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, [], undefined) }).to.throw(TypeError, msg(undefined))
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'sys', components, []) }).to.throw(TypeError, msg())
        })
    })
})