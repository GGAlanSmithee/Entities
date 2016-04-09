import { expect }                    from 'chai';
import sinon                         from 'sinon';
import SystemManager, { SystemType } from '../../src/core/system';
import { SelectorType }              from '../../src/core/entity';

describe('SystemManager', function() {
    describe('registerSystem(type = SystemType.Logic, selector = SelectorType.GetWith, components = 0, callback = undefined)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.registerSystem).to.be.a('function');
        });
        
        it('adds a system under the correct type', () => {
            expect(this.systemManager.logicSystems).property('size').to.equal(0);
            expect(this.systemManager.renderSystems).property('size').to.equal(0);
            expect(this.systemManager.initSystems).property('size').to.equal(0);
            
            this.systemManager.registerSystem(SystemType.Logic, SelectorType.GetWith, 1 | 2, () => { });
            this.systemManager.registerSystem(SystemType.Render, SelectorType.GetWith, 1 | 2, () => { });
            this.systemManager.registerSystem(SystemType.Init, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1);
            expect(this.systemManager.renderSystems).property('size').to.equal(1);
            expect(this.systemManager.initSystems).property('size').to.equal(1);
        });
        
        it('returns the added sytems id', () => {
            let system = this.systemManager.registerSystem(SystemType.Render, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(1);
            
            system = this.systemManager.registerSystem(SystemType.Logic, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(2);
            
            system = this.systemManager.registerSystem(SystemType.Init, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(3);
            
            system = this.systemManager.registerSystem(SystemType.Render, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(4);
            
            system = this.systemManager.registerSystem(SystemType.Logic, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(5);
            
            system = this.systemManager.registerSystem(SystemType.Init, SelectorType.GetWith, 1 | 2, () => { });
            
            expect(system).to.equal(6);
        });
        
        it('adds a system with the correct [type] and [selector]', () => {
            let logicSystem   = this.systemManager.registerSystem(SystemType.Logic, SelectorType.Get, 1 | 2, () => { });
            let renderSystem  = this.systemManager.registerSystem(SystemType.Render, SelectorType.GetWith, 1 | 2, () => { });
            let initSystem  = this.systemManager.registerSystem(SystemType.Init, SelectorType.GetWith, 1 | 2, () => { });
            let logicSystem2  = this.systemManager.registerSystem(SystemType.Logic, SelectorType.GetWithOnly, 1 | 2, () => { });
            let renderSystem2 = this.systemManager.registerSystem(SystemType.Render, SelectorType.GetWithout, 1 | 2, () => { });
            let initSystem2  = this.systemManager.registerSystem(SystemType.Init, SelectorType.Get, 1 | 2, () => { });

            expect(this.systemManager.logicSystems.get(logicSystem)).property('selector').to.equal(SelectorType.Get);
            expect(this.systemManager.renderSystems.get(renderSystem)).property('selector').to.equal(SelectorType.GetWith);
            expect(this.systemManager.initSystems.get(initSystem)).property('selector').to.equal(SelectorType.GetWith);
            expect(this.systemManager.logicSystems.get(logicSystem2)).property('selector').to.equal(SelectorType.GetWithOnly);
            expect(this.systemManager.renderSystems.get(renderSystem2)).property('selector').to.equal(SelectorType.GetWithout);
            expect(this.systemManager.initSystems.get(initSystem2)).property('selector').to.equal(SelectorType.Get);
        });
        
        it('registeres a system with the correct correct [components] and [callback]', () => {
            let spy = sinon.spy();
            
            let systemId = this.systemManager.registerSystem(SystemType.Logic, SelectorType.Get, 1 | 2, spy);
            
            let system = this.systemManager.logicSystems.get(systemId);
            
            expect(system).property('components').to.equal(1 | 2);
            
            system.callback();
            
            expect(system.callback.calledOnce).to.be.true;
        });
        
        it('throws error if [type] is not a valid SystemType', () => {
            expect(() => { this.systemManager.registerSystem(3, SelectorType.Get, 1 | 2, () => { }); }).to.throw(TypeError, 'type must be a valid SystemType.');
        });
        
        it('throws error if [selector] is not a valid SelectorType', () => {
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, 4, 1 | 2, () => { }); }).to.throw(TypeError, 'selector must be a valid SelectorType.');
        });
        
        it('throws error if [components] is not a number', () => {
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, SelectorType.Get, 'component', () => { }); }).to.throw(TypeError, 'components must be a number.');
        });
        
        it('throws error if [callback] is not a function', () => {
            expect(() => { this.systemManager.registerSystem(SystemType.Logic, SelectorType.GetWith, 1 | 2, { }); }).to.throw(TypeError, 'callback must be a function.');
        });
    });
});