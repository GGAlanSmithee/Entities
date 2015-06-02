var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World implementation', function() {
    beforeEach(function() {
        this.world = new Entities.World();
    });
    
    afterEach(function() {
        delete this.world;
    });
        
    describe('registerComponent(type, object, returnDetails)', function() {
        it('is a function', function() {
            expect(this.world.registerComponent).to.be.a('function');
        });
        
        it('returns an object when [returnDetails] is true', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component, true);
            
            expect(registeredComponent).to.be.an('object');
        });
        
        it('returns an id (number) when [returnDetails] is false or omitted', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component, false);
            expect(registeredComponent).to.be.a('number');
            
            registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(registeredComponent).to.be.a('number');
        });
        
        it('increments component ids as bytes [1, 2, 4, 8, 16, ...] when components are registered', function() {
            var component = {
                x : 20
            };
            
            var componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(componentId).to.equal(1);
            
            componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(componentId).to.equal(2);
            
            componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(componentId).to.equal(4);
            
            componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(componentId).to.equal(8);
            
            componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(componentId).to.equal(16);
            
            var components = this.world.components;
            
            expect(components).to.be.an('object');
            expect(components).to.include.keys('0');
            expect(components).to.include.keys('1');
            expect(components).to.include.keys('2');
            expect(components).to.include.keys('4');
            expect(components).to.include.keys('8');
            expect(components).to.include.keys('16');
            
            var keys = Object.keys(components);
            var i = keys.length - 1;
            while (i >= 0) {
                var id = Math.floor(keys[i]);

                if (id !== 1) {
                    expect(id % 2).to.equal(0);
                }
                
                --i;
            }
        });
        
        it('succesfully registers a static component', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component, true);
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent).property('type').to.equal(Entities.World.ComponentType.Static);
        });
        
        it('succesfully registers a dynamic component', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Dynamic, component, true);
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent.type).to.equal(Entities.World.ComponentType.Dynamic);
        });
        
        it('succesfully registers a semidynamic component', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, component, true);
            
            expect(registeredComponent).to.have.property('object');
            expect(registeredComponent).to.have.property('type');
            
            expect(registeredComponent).property('object').to.equal(component);
            expect(registeredComponent).property('type').to.equal(Entities.World.ComponentType.SemiDynamic);
        });
        
        it('adds a component to all existing entities when registering a static component', function() {
            var component = {
                x : 20
            };
            
            var componentId = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            
            for (var i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i][componentId]).to.be.an('object');
                expect(this.world.entities[i][componentId]).to.have.property('x');
                expect(this.world.entities[i][componentId]).property('x').to.equal(20);
            }
        });
    });
});