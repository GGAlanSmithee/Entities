import { expect } from 'chai';
import   World    from '../../src/core/World';

describe('World', function() {
    describe('newComponent(object)', () => {
        beforeEach(() => {
            this.world = new World();
        });
        
        afterEach(() => {
            delete this.world;
        });
        
        it('is a function', () => {
            expect(this.world.newComponent).to.be.a('function');
        });
        
        it('creates a new component from an object', () => {
            let component = this.world.newComponent({ x : 10 });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from a function', () => {
            let component = this.world.newComponent(function() { this.x = 10; });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from an int', () => {
            let component = this.world.newComponent(5);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(5);
            
            component = this.world.newComponent(-1);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(-1);
        });
        
        it('creates a new component from a float', () => {
            let component = this.world.newComponent(5.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(5.5);
            expect(component).to.not.equal(5);
            
            component = this.world.newComponent(-20.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(-20.5);
            expect(component).to.not.equal(-20.0);
        });
        
        it('creates a new component from a string', () => {
            let component = this.world.newComponent('test');
            
            expect(component).to.be.a('string');
            expect(component).to.equal('test');
            
            component = this.world.newComponent('');
            
            expect(component).to.be.a('string');
            expect(component).to.equal('');
        });
        
        it('return null on bad input', () => {
            let component = this.world.newComponent();
            
            expect(component).to.be.null;
            
            component = this.world.newComponent(null);
            
            expect(component).to.be.null;
            
            component = this.world.newComponent(undefined);
            
            expect(component).to.be.null;
            
            component = this.world.newComponent(0);
            
            expect(component).to.not.be.null;
            
            component = this.world.newComponent(-1);
            
            expect(component).to.not.be.null;
        });
    });
});