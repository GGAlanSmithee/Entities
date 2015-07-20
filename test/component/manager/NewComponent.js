import { expect }       from 'chai';
import ComponentManager from '../../../src/core/Component';

describe('ComponentManager', function() {
    describe('newComponent(object)', () => {
        beforeEach(() => {
            this.componentManager = new ComponentManager();
        })
        
        afterEach(() => {
            delete this.componentManager;
        })
        
        it('is a function', () => {
            expect(this.componentManager.newComponent).to.be.a('function');
        });
        
        it('creates a new component from an object', () => {
            let component = this.componentManager.newComponent({ x : 10 });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from a function', () => {
            let component = this.componentManager.newComponent(function() { this.x = 10; });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from an int', () => {
            let component = this.componentManager.newComponent(5);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(5);
            
            component = this.componentManager.newComponent(-1);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(-1);
        });
        
        it('creates a new component from a float', () => {
            let component = this.componentManager.newComponent(5.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(5.5);
            expect(component).to.not.equal(5);
            
            component = this.componentManager.newComponent(-20.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(-20.5);
            expect(component).to.not.equal(-20.0);
        });
        
        it('creates a new component from a string', () => {
            let component = this.componentManager.newComponent('test');
            
            expect(component).to.be.a('string');
            expect(component).to.equal('test');
            
            component = this.componentManager.newComponent('');
            
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
            
            component = this.componentManager.newComponent(0);
            
            expect(component).to.not.be.null;
            
            component = this.componentManager.newComponent(-1);
            
            expect(component).to.not.be.null;
        });
    });
});