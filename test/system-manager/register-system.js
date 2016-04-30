import { expect }                    from 'chai'
import sinon                         from 'sinon'
import SystemManager, { SystemType } from '../../src/core/system-manager'

describe('SystemManager', function() {
    describe('registerSystem(type = SystemType.Logic, selector = SelectorType.GetWith, components = 0, callback = undefined)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager()
            
            this.movement = 'movement'
            this.render = 'render'
            this.init = 'init'
        })
        
        afterEach(() => {
            delete this.systemManager
        })

        it('is a function', () => {
            expect(this.systemManager.registerSystem).to.be.a('function')
        })
        
        it('adds a system under the correct type', () => {
            expect(this.systemManager.logicSystems).property('size').to.equal(0)
            expect(this.systemManager.renderSystems).property('size').to.equal(0)
            expect(this.systemManager.initSystems).property('size').to.equal(0)
            
            this.systemManager.registerSystem(this.movement, SystemType.Logic, [ 'position', 'velocity' ], () => { })
            this.systemManager.registerSystem(this.render, SystemType.Render, [ 'position', 'appearance' ], () => { })
            this.systemManager.registerSystem(this.init, SystemType.Init, [], () => { })
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1)
            expect(this.systemManager.renderSystems).property('size').to.equal(1)
            expect(this.systemManager.initSystems).property('size').to.equal(1)
        })
        
        it('returns the added sytems key', () => {
            const movementSystem = this.systemManager.registerSystem(this.movement, SystemType.Logic, [ 'position', 'velocity' ], () => { })
            
            expect(movementSystem).to.equal(this.movement)
            
            const renderSystem = this.systemManager.registerSystem(this.render, SystemType.Render, [ 'position', 'appearance' ], () => { })
            
            expect(renderSystem).to.equal(this.render)
            
            const initSystem = this.systemManager.registerSystem(this.init, SystemType.Init, [], () => { })
            
            expect(initSystem).to.equal(this.init)
        })
        
        it('adds a system with the correct [type] and [components]', () => {
            const logicSystem = this.systemManager.registerSystem(this.movement, SystemType.Logic, [ 'position' ], () => { })
            const renderSystem = this.systemManager.registerSystem(this.render, SystemType.Render, [ 'position', 'appearance' ], () => { })
            const initSystem = this.systemManager.registerSystem(this.init, SystemType.Init, [], () => { })
            const logicSystem2 = this.systemManager.registerSystem(`${this.movement}2`, SystemType.Logic, [ 'position', 'velocity' ], () => { })
            const renderSystem2 = this.systemManager.registerSystem(`${this.render}2`, SystemType.Render, [ 'position' ], () => { })
            const initSystem2 = this.systemManager.registerSystem(`${this.init}2`, SystemType.Init, [ 'velocity'], () => { })
            
            expect(this.systemManager.logicSystems.get(logicSystem)).property('components').to.deep.equal([ 'position' ])
            expect(this.systemManager.renderSystems.get(renderSystem)).property('components').to.deep.equal([ 'position', 'appearance' ])
            expect(this.systemManager.initSystems.get(initSystem)).property('components').to.deep.equal([])
            expect(this.systemManager.logicSystems.get(logicSystem2)).property('components').to.deep.equal([ 'position', 'velocity' ])
            expect(this.systemManager.renderSystems.get(renderSystem2)).property('components').to.deep.equal([ 'position' ])
            expect(this.systemManager.initSystems.get(initSystem2)).property('components').to.deep.equal([ 'velocity' ])
        })
        
        it('registeres a system with the correct correct [callback]', () => {
            const spy = sinon.spy()
            
            const movementSystem = this.systemManager.registerSystem(this.movement, SystemType.Logic, [ 'position', 'velocity' ], spy)
            
            this.systemManager.logicSystems.get(movementSystem).callback()
            
            expect(spy.calledOnce).to.be.true
        })
        
        it('throws error if [key] is not a string or is empty', () => {
            expect(() => this.systemManager.registerSystem(undefined, SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem(null, SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem([], SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem({}, SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem(1, SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem(1.2, SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
            expect(() => this.systemManager.registerSystem('', SystemType.Init, [], () => { })).to.throw(TypeError, 'key must be a non-empty string.')
        })
        
        it('throws error if [type] is not a valid SystemType', () => {
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Init + 1, [], () => { })).to.throw(TypeError, 'type must be a valid SystemType.')
        })
        
        it('throws error if [components] is not an array', () => {
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, null, () => { })).to.throw(TypeError, 'components argument must be an array of components.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, undefined, () => { })).to.throw(TypeError, 'components argument must be an array of components.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, {}, () => { })).to.throw(TypeError, 'components argument must be an array of components.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, 1, () => { })).to.throw(TypeError, 'components argument must be an array of components.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, 1.2, () => { })).to.throw(TypeError, 'components argument must be an array of components.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, 'not an array', () => { })).to.throw(TypeError, 'components argument must be an array of components.')
        })
        
        it('throws error if [callback] is not a function', () => {
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [])).to.throw(TypeError, 'callback must be a function.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [], { })).to.throw(TypeError, 'callback must be a function.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [], 1)).to.throw(TypeError, 'callback must be a function.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [], '')).to.throw(TypeError, 'callback must be a function.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [], 1.2)).to.throw(TypeError, 'callback must be a function.')
            expect(() => this.systemManager.registerSystem(this.movement, SystemType.Logic, [], null)).to.throw(TypeError, 'callback must be a function.')
        })
    })
})