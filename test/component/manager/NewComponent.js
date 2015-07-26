import { expect }       from 'chai';
import ComponentManager from '../../../src/core/Component';

describe('ComponentManager', function() {
    describe('newComponent(componentId)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
        })
        
        afterEach(() => {
            delete this.componentManager;
        })
        
        it('is a function', () => {
            expect(this.componentManager.newComponent).to.be.a('function');
        });
        
        it('creates a new component from a function', () => {
            let componentId = 0;
            
            this.componentManager.components.set(componentId, function() { 
                this.x = 10.0;
                this.y = 10.0;
            });
            
            let component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10.0);
            expect(component).to.have.property('y');
            expect(component).property('y').to.equal(10.0);
            expect(component).to.not.have.property('z');
        });
        
        it('creates a new component from an object', () => {
            let componentId = 0;
            
            this.componentManager.components.set(componentId, { 
                x : 10.0,
                y : 10.0
            });
            
            let component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10.0);
            expect(component).to.have.property('y');
            expect(component).property('y').to.equal(10.0);
            expect(component).to.not.have.property('z');
        });
        
        it('creates a new component from an int', () => {
            let componentId = 0;
            
            this.componentManager.components.set(componentId, 5);
            
            let component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(5);
            
            this.componentManager.components.set(componentId, -10);
            
            component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(-10);
        });
        
        it('creates a new component from a float', () => {
            let componentId = 0;
            
            this.componentManager.components.set(componentId, 5.5);
            
            let component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(5.5);
            expect(component).to.not.equal(5);
            
            this.componentManager.components.set(componentId, -20.5);
            
            component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(-20.5);
            expect(component).to.not.equal(-20.0);
        });
        
        it('creates a new component from a string', () => {
            let componentId = 0;
            
            this.componentManager.components.set(componentId, 'test');
            
            let component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('string');
            expect(component).to.equal('test');
            
            this.componentManager.components.set(componentId, '');
            
            component = this.componentManager.newComponent(componentId);
            
            expect(component).to.be.a('string');
            expect(component).to.equal('');
        });
        
        it('returns null on bad input', () => {
            let component = this.componentManager.newComponent();
            
            expect(component).to.be.null;
            
            component = this.componentManager.newComponent(null);
            
            expect(component).to.be.null;
            
            component = this.componentManager.newComponent(undefined);
            
            expect(component).to.be.null;
        });
    });
});