import { expect } from 'chai';
import   sinon from 'sinon';
import   SystemManager, { SystemType } from '../../src/core/System';
import { SelectorType } from '../../src/core/Entity';

describe('SystemManager', function() {
    describe('addSystem(callback, components, type, selector)', () => {
        beforeEach(() => {
            this.systemManager = new SystemManager();
        });
        
        afterEach(() => {
            delete this.systemManager;
        });

        it('is a function', () => {
            expect(this.systemManager.addSystem).to.be.a('function');
        });
        
        it('adds a system under the correct type', () => {
            expect(this.systemManager.logicSystems).property('size').to.equal(0);
            expect(this.systemManager.renderSystems).property('size').to.equal(0);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.GetWith);
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWith);
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1);
            expect(this.systemManager.renderSystems).property('size').to.equal(1);
        });
        
        it('returns the added sytems id', () => {
            let system = this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(system).to.equal(1);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic);
            
            expect(system).to.equal(2);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render);
            
            expect(system).to.equal(3);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic);
            
            expect(system).to.equal(4);
        });
        
        it('adds a system with the correct [type] and [selector]', () => {
            let logicSystem   = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.Get);
            let renderSystem  = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWith);
            let logicSystem2  = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.GetWithOnly);
            let renderSystem2 = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWithout);
            
            let systems = this.systemManager.systems;
            
            expect(this.systemManager.logicSystems.get(logicSystem)).property('selector').to.equal(SelectorType.Get);
            expect(this.systemManager.renderSystems.get(renderSystem)).property('selector').to.equal(SelectorType.GetWith);
            expect(this.systemManager.logicSystems.get(logicSystem2)).property('selector').to.equal(SelectorType.GetWithOnly);
            expect(this.systemManager.renderSystems.get(renderSystem2)).property('selector').to.equal(SelectorType.GetWithout);
        });
        
        it('registeres a system with the correct correct [components] and [callback]', () => {
            
            let spy = sinon.spy();
            
            let systemId = this.systemManager.addSystem(spy, 1 | 2, SystemType.Logic, SelectorType.Get);
            
            let system = this.systemManager.logicSystems.get(systemId);
            
            expect(system).property('components').to.equal(1 | 2);
            
            system.callback();
            
            expect(system.callback.calledOnce).to.be.true;
        });
        
        it('adds a system with type SystemType.Logic if [type] is omitted', () => {
            this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(this.systemManager.logicSystems).property('size').to.equal(1);
            expect(this.systemManager.renderSystems).property('size').to.equal(0);
        });
        
        it('adds a system with selector SelectorType.GetWith if [selector] is omitted or not a SelectorType', () => {
            let system = this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(this.systemManager.logicSystems.get(system)).property('selector').to.equal(SelectorType.GetWith);
        });
        
        it('sets [components] to 0 and [selector] to SelectorType.GetWith if components is omitted or 0', () => {
            let systemId = this.systemManager.addSystem(() => { });
            
            let system = this.systemManager.logicSystems.get(systemId);
            
            expect(system).property('components').to.equal(0);
            expect(system).property('selector').to.equal(SelectorType.GetWith);
            
            systemId = this.systemManager.addSystem(() => { }, 0);
            
            system = this.systemManager.logicSystems.get(systemId);
            
            expect(system).property('components').to.equal(0);
            expect(system).property('selector').to.equal(SelectorType.GetWith);
        });
        
        it('throws error if [callback] is not a function', () => {
            expect(() => { this.systemManager.addSystem({ }, 1 | 2); }).to.throw(TypeError, 'callback must be a function.');
        });
    });
});