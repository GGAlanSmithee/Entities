var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World', function() {
    describe('newComponent(object)', function() {
        beforeEach(function() {
            this.world = new Entities.World();
        });
        
        afterEach(function() {
            delete this.world;
        });
        
        it('is a function', function() {
            expect(Entities.World.newComponent).to.be.an('function');
        });
        
        it('creates a new component from an object', function() {
            var component = Entities.World.newComponent({ x : 10 });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from a function', function() {
            var component = Entities.World.newComponent(function() { this.x = 10; });
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('x');
            expect(component).property('x').to.equal(10);
            expect(component).to.not.have.property('y');
        });
        
        it('creates a new component from an int', function() {
            var component = Entities.World.newComponent(5);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(5);
            
            component = Entities.World.newComponent(-1);
            
            expect(component).to.be.a('number');
            expect(component).to.equal(-1);
        });
        
        it('creates a new component from a float', function() {
            var component = Entities.World.newComponent(5.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(5.5);
            expect(component).to.not.equal(5);
            
            component = Entities.World.newComponent(-20.5);
            
            expect(component).to.be.a('number');
            expect(Number.isInteger(component)).to.be.false;
            expect(component).to.equal(-20.5);
            expect(component).to.not.equal(-20.0);
        });
        
        it('creates a new component from a string', function() {
            var component = Entities.World.newComponent('test');
            
            expect(component).to.be.a('string');
            expect(component).to.equal('test');
            
            component = Entities.World.newComponent('');
            
            expect(component).to.be.a('string');
            expect(component).to.equal('');
        });
        
        it('return null on bad input', function() {
            var component = Entities.World.newComponent();
            
            expect(component).to.be.null;
            
            component = Entities.World.newComponent(null);
            
            expect(component).to.be.null;
            
            component = Entities.World.newComponent(undefined);
            
            expect(component).to.be.null;
            
            component = Entities.World.newComponent(0);
            
            expect(component).to.not.be.null;
            
            component = Entities.World.newComponent(-1);
            
            expect(component).to.not.be.null;
        });
    });
});