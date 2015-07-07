import { expect }        from 'chai';
import   World           from '../../src/core/World';
import   sinon           from 'sinon';
import { ComponentType } from '../../src/core/Component';

describe('World', function() {
    describe('registerComponent(component, type = ComponentType.Static, returnDetails = false)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.registerComponent).to.be.a('function');
        });
        
        it('calls [getNextComponentId] to get the first available component id', () => {
            let spy = sinon.spy(this.world, 'getNextComponentId');
            
            this.world.registerComponent({ });
            
            expect(spy.calledOnce).to.be.true;
        });
        
        it('returns the components id (number) when [returnDetails] = false or omitted', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.registerComponent(component, ComponentType.Static, false);
            expect(registeredComponent).to.be.a('number');
            expect(registeredComponent).to.equal(1);
            
            registeredComponent = this.world.registerComponent(component);
            expect(registeredComponent).to.be.a('number');
            expect(registeredComponent).to.equal(2);
        });
        
        it('returns the actual object when [returnDetails] = true', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.registerComponent(component, ComponentType.Static, true);
            expect(registeredComponent).to.be.an('object');
        });
        
        it('registers a component as type static when [type] is omitted', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.components.get(this.world.registerComponent(component));
            
            expect(registeredComponent).to.be.an('object');
            expect(registeredComponent).property('type').to.equal(ComponentType.Static);
        });
        
        it('gives an error (exception) when [object] = null or omitted', () => {
            expect(() => this.world.registerComponent()).to.throw(TypeError, 'object cannot be null.');
            expect(() => this.world.registerComponent(null)).to.throw(TypeError, 'object cannot be null.');
        });
        
        it('increments component ids as bits [1, 2, 4, 8, 16, ...] when components are registered', () => {
            let component = {
                x : 20
            };
            
            let componentId = this.world.registerComponent(component, ComponentType.Static, false);
            expect(componentId).to.equal(1);
            
            componentId = this.world.registerComponent(component, ComponentType.Static, false);
            expect(componentId).to.equal(2);
            
            componentId = this.world.registerComponent(component, ComponentType.Static, false);
            expect(componentId).to.equal(4);
            
            componentId = this.world.registerComponent(component, ComponentType.Static, false);
            expect(componentId).to.equal(8);
            
            componentId = this.world.registerComponent(component, ComponentType.Static, false);
            expect(componentId).to.equal(16);
            
            let components = this.world.components;
            
            expect(components).to.be.a('map');
            expect(components.has(0)).to.be.true;
            expect(components.has(1)).to.be.true;
            expect(components.has(2)).to.be.true;
            expect(components.has(3)).to.be.false;
            expect(components.has(4)).to.be.true;
            expect(components.has(5)).to.be.false;
            expect(components.has(6)).to.be.false;
            expect(components.has(7)).to.be.false;
            expect(components.has(8)).to.be.true;
            expect(components.has(9)).to.be.false;
            expect(components.has(10)).to.be.false;
            expect(components.has(11)).to.be.false;
            expect(components.has(12)).to.be.false;
            expect(components.has(13)).to.be.false;
            expect(components.has(14)).to.be.false;
            expect(components.has(15)).to.be.false;
            expect(components.has(16)).to.be.true;
            expect(components.has(17)).to.be.false;
            
            for (let i in components) {
                expect(i % 2).to.equal(0);
            }
        });
        
        it('succesfully registers a static component', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.components.get(this.world.registerComponent(component));
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent).property('type').to.equal(ComponentType.Static);
        });
        
        it('succesfully registers a dynamic component', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.components.get(this.world.registerComponent(component, ComponentType.Dynamic));
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent.type).to.equal(ComponentType.Dynamic);
        });
        
        it('succesfully registers a semidynamic component', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.world.components.get(this.world.registerComponent(component, ComponentType.SemiDynamic));
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent).property('type').to.equal(ComponentType.SemiDynamic);
        });
        
        it('adds a component to all existing entities when registering a static component', () => {
            let component = {
                x : 20
            };
            
            let componentId = this.world.registerComponent(component, ComponentType.Static, false);

            for (let i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i]).to.have.property([componentId]);
                expect(this.world.entities[i]).property([componentId]).to.be.an('object');
                expect(this.world.entities[i]).property([componentId]).to.have.property('x');
                expect(this.world.entities[i]).property([componentId]).property('x').to.equal(20);
            }
        });
        
        it('does not add a component to all existing entities when registering a semi dynamic component', () => {
            let component = {
                x : 20
            };
            
            let componentId = this.world.registerComponent(component, ComponentType.SemiDynamic, false);
            
            for (let i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i]).to.not.have.property([componentId]);
            }
        });
        
        it('does not add a component to all existing entities when registering a dynamic component', () => {
            let component = {
                x : 20
            };
            
            let componentId = this.world.registerComponent(component, ComponentType.Dynamic, false);
            
            for (let i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i]).to.not.have.property([componentId]);
            }
        });
    });
});