import { expect } from 'chai';
import   sinon from 'sinon';
import   SystemManager, { SystemType } from '../../src/core/System';
import { SelectorType } from '../../src/core/World';

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
            expect(this.systemManager.systems.get(SystemType.Init)).property('size').to.equal(0);
            expect(this.systemManager.systems.get(SystemType.Logic)).property('size').to.equal(0);
            expect(this.systemManager.systems.get(SystemType.Render)).property('size').to.equal(0);
            expect(this.systemManager.systems.get(SystemType.CleanUp)).property('size').to.equal(0);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Init, SelectorType.GetWith);
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.GetWith);
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWith);
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.CleanUp, SelectorType.GetWith);
            
            expect(this.systemManager.systems.get(SystemType.Init)).property('size').to.equal(1);
            expect(this.systemManager.systems.get(SystemType.Logic)).property('size').to.equal(1);
            expect(this.systemManager.systems.get(SystemType.Render)).property('size').to.equal(1);
            expect(this.systemManager.systems.get(SystemType.CleanUp)).property('size').to.equal(1);
        });
        
        it('returns the added sytems id', () => {
            let system = this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(system).to.equal(0);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic);
            
            expect(system).to.equal(1);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render);
            
            expect(system).to.equal(2);
            
            system = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.CleanUp);
            
            expect(system).to.equal(3);
        });
        
        it('increases [maxRegisteredSystemId] as systems are added', () => {
            expect(this.systemManager).property('maxRegisteredSystemId').to.equal(-1);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Init, SelectorType.GetWith);
            expect(this.systemManager).property('maxRegisteredSystemId').to.equal(0);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.GetWith);
            expect(this.systemManager).property('maxRegisteredSystemId').to.equal(1);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWith);
            expect(this.systemManager).property('maxRegisteredSystemId').to.equal(2);
            
            this.systemManager.addSystem(() => { }, 1 | 2, SystemType.CleanUp, SelectorType.GetWith);
            expect(this.systemManager).property('maxRegisteredSystemId').to.equal(3);
        });
        
        it('adds a system with the correct [type] and [selector]', () => {
            let initSystem    = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Init, SelectorType.Get);
            let logicSystem   = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Logic, SelectorType.GetWith);
            let renderSystem  = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.Render, SelectorType.GetWithOnly);
            let cleanUpSystem = this.systemManager.addSystem(() => { }, 1 | 2, SystemType.CleanUp, SelectorType.GetWithout);
            
            let systems = this.systemManager.systems;
            
            expect(systems.get(SystemType.Init).get(initSystem)).property('selector').to.equal(SelectorType.Get);
            expect(systems.get(SystemType.Logic).get(logicSystem)).property('selector').to.equal(SelectorType.GetWith);
            expect(systems.get(SystemType.Render).get(renderSystem)).property('selector').to.equal(SelectorType.GetWithOnly);
            expect(systems.get(SystemType.CleanUp).get(cleanUpSystem)).property('selector').to.equal(SelectorType.GetWithout);
        });
        
        it('registeres a system with the correct correct [components] and [callback]', () => {
            
            var spy = sinon.spy();
            
            let systemId = this.systemManager.addSystem(spy, 1 | 2, SystemType.Init, SelectorType.Get);
            
            let system = this.systemManager.systems.get(SystemType.Init).get(systemId);
            
            expect(system).property('components').to.equal(1 | 2);
            
            system.callback();
            
            expect(system.callback.calledOnce).to.be.true;
        });
        
        it('adds a system with type SystemType.Logic if [type] is omitted', () => {
            this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(this.systemManager.systems.get(SystemType.Init)).property('size').to.equal(0);
            expect(this.systemManager.systems.get(SystemType.Logic)).property('size').to.equal(1);
            expect(this.systemManager.systems.get(SystemType.Render)).property('size').to.equal(0);
            expect(this.systemManager.systems.get(SystemType.CleanUp)).property('size').to.equal(0);
        });
        
        it('adds a system with selector SelectorType.GetWith if [selector] is omitted or not a SelectorType', () => {
            let system = this.systemManager.addSystem(() => { }, 1 | 2);
            
            expect(this.systemManager.systems.get(SystemType.Logic).get(system)).property('selector').to.equal(SelectorType.GetWith);
        });
        
        it('sets [components] to [NoneComponent] and [selector] to SelectorType.Get if components is omitted, not an integer or 0', () => {
            let systemId = this.systemManager.addSystem(() => { });
            
            let system = this.systemManager.systems.get(SystemType.Logic).get(systemId);
            
            expect(system).property('components').to.equal(0);
            expect(system).property('selector').to.equal(SelectorType.Get);
            
            systemId = this.systemManager.addSystem(() => { }, 1.2);
            
            system = this.systemManager.systems.get(SystemType.Logic).get(systemId);
            
            expect(system).property('components').to.equal(0);
            expect(system).property('selector').to.equal(SelectorType.Get);
            
            systemId = this.systemManager.addSystem(() => { }, 0);
            
            system = this.systemManager.systems.get(SystemType.Logic).get(systemId);
            
            expect(system).property('components').to.equal(0);
            expect(system).property('selector').to.equal(SelectorType.Get);
        });
        
        it('throws error if [callback] is not a function', () => {
            expect(() => { this.systemManager.addSystem({ }, 1 | 2); }).to.throw(TypeError, 'callback must be a function.');
        });
    });
});