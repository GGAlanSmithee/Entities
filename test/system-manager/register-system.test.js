import { expect }                    from 'chai'
import sinon                         from 'sinon'
import { SystemManager, SystemType } from '../../src/core/system-manager'

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
            
            this.systemManager.registerSystem(SystemType.Logic, 1 | 2, () => { })
            this.systemManager.registerSystem(SystemType.Render, 1 | 2, () => { })
            this.systemManager.registerSystem(SystemType.Init, 1 | 2, () => { })
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1)
            expect(this.systemManager.renderSystems).property('size').to.equal(1)
            expect(this.systemManager.initSystems).property('size').to.equal(1)
        })
        
        test('returns the added sytems id', () => {
            let system = this.systemManager.registerSystem(SystemType.Render, 1 | 2, () => { })
            
            expect(system).to.equal(1)
            
            system = this.systemManager.registerSystem(SystemType.Logic, 1 | 2, () => { })
            
            expect(system).to.equal(2)
            
            system = this.systemManager.registerSystem(SystemType.Init, 1 | 2, () => { })
            
            expect(system).to.equal(3)
            
            system = this.systemManager.registerSystem(SystemType.Render, 1 | 2, () => { })
        
            expect(system).to.equal(4)
            
            system = this.systemManager.registerSystem(SystemType.Logic, 1 | 2, () => { })
            
            expect(system).to.equal(5)
            
            system = this.systemManager.registerSystem(SystemType.Init, 1 | 2, () => { })
            
            expect(system).to.equal(6)
        })
        
        test('registeres a system with the correct correct [components] and [callback]', () => {
            let spy = sinon.spy()
            
            let systemId = this.systemManager.registerSystem(SystemType.Logic, 1 | 2, spy)
            
            let system = this.systemManager.logicSystems.get(systemId)
            
            expect(system).property('components').to.equal(1 | 2)
            
            system.callback()
            
            expect(system.callback.calledOnce).to.be.true
        })
        
        test('throws error if [type] is not a valid SystemType', () => {
            expect(() => { this.systemManager.registerSystem(3, 1 | 2, () => { }) }).to.throw(TypeError, 'type must be a valid SystemType.')
        })
        
        test('throws error if [components] is not a number', () => {
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 'component', () => { }) }).to.throw(TypeError, 'components must be a number.')
        })
        
        test('throws error if [callback] is not a function', () => {
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 1 | 2, { }) }).to.throw(TypeError, 'callback must be a function.')
        })
    })
})