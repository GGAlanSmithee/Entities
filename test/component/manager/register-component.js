import { expect }       from 'chai';
import ComponentManager from '../../../src/core/component';

describe('ComponentManager', function() {
    describe('registerComponent(component)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
        });
        
        afterEach(() => {
            delete this.componentManager;
        });
        
        it('is a function', () => {
            expect(this.componentManager.registerComponent).to.be.a('function');
        });
        
        it('returns the components id', () => {
            let component = {
                x : 20
            };
            
            let registeredComponent = this.componentManager.registerComponent(component);
            expect(registeredComponent).to.be.a('number');
            expect(registeredComponent).to.equal(1);
        });
        
        it('gives an error (exception) when [component] = null or omitted', () => {
            expect(() => this.componentManager.registerComponent()).to.throw(TypeError, 'component cannot be null.');
            expect(() => this.componentManager.registerComponent(null)).to.throw(TypeError, 'component cannot be null.');
        });
        
        it('increments component ids as bits [1, 2, 4, 8, 16, ...] when components are registered', () => {
            let component = {
                x : 20
            };
            
            let componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(1);
            
            componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(2);
            
            componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(4);
            
            componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(8);
            
            componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(16);
            
            componentId = this.componentManager.registerComponent(component);
            expect(componentId).to.equal(32);
            
            let components = this.componentManager.components;
            
            expect(components).to.be.a('map');
            expect(components.has(0)).to.be.false;
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
            expect(components.has(31)).to.be.false;
            expect(components.has(32)).to.be.true;
            expect(components.has(33)).to.be.false;
            expect(components.has(64)).to.be.false;
            
            for (let i of components.keys()) {
                if (i !== 1) {
                    expect(i % 2).to.equal(0);
                }
            }
        });
    });
});