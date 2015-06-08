var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World', function() {
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
        
        it('returns an id (number) when [returnDetails] is false', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component, false);
            expect(registeredComponent).to.be.a('number');
        });
        
        it('returns an id (number) when [returnDetails] is omitted', function() {
            var component = {
                x : 20
            };
            
            var registeredComponent = this.world.registerComponent(Entities.World.ComponentType.Static, component);
            expect(registeredComponent).to.be.a('number');
        });
        
        it('gives an error (exception) when [type] or [object] is omitted', function() {
            var self = this;
            
            var noArgs = function() {
                self.world.registerComponent();
            }
            
            expect(noArgs).to.throw(Error);
            
            var noObj = function() {
                self.world.registerComponent(Entities.World.ComponentType.Static);
            }
            
            expect(noObj).to.throw(Error);
        });
        
        it('creates a component with type set as static when a bad type is givven', function() {
            var component = {
                x : 20
            };
            
            var component = this.world.registerComponent('a bad type', component, true);
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('type');
            expect(component).property('type').to.equal(Entities.World.ComponentType.Static);
            
            component = this.world.registerComponent(3, component, true);
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('type');
            expect(component).property('type').to.equal(Entities.World.ComponentType.Static);
            
            component = this.world.registerComponent(-1, component, true);
            
            expect(component).to.be.an('object');
            expect(component).to.have.property('type');
            expect(component).property('type').to.equal(Entities.World.ComponentType.Static);
        });
        
        it('increments component ids as bits [1, 2, 4, 8, 16, ...] when components are registered', function() {
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
                expect(this.world.entities[i]).to.have.property([componentId]);
                expect(this.world.entities[i]).property([componentId]).to.be.an('object');
                expect(this.world.entities[i]).property([componentId]).to.have.property('x');
                expect(this.world.entities[i]).property([componentId]).property('x').to.equal(20);
            }
        });
        
        it('does not add a component to all existing entities when registering a semi dynamic component', function() {
            var component = {
                x : 20
            };
            
            var componentId = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, component);
            
            for (var i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i]).to.not.have.property([componentId]);
            }
        });
        
        it('does not add a component to all existing entities when registering a dynamic component', function() {
            var component = {
                x : 20
            };
            
            var componentId = this.world.registerComponent(Entities.World.ComponentType.Dynamic, component);
            
            for (var i = 0; i < this.world.entities.length; ++i) {
                expect(this.world.entities[i]).to.not.have.property([componentId]);
            }
        });
    });
    
    describe('addComponent(entity, componentId)', function() {
        beforeEach(function() {
            this.component = this.world.registerComponent(Entities.World.ComponentType.Static, { x : 10, y : 20 });
            this.entity = 0;
        });
        
        it('is a function', function() {
            expect(this.world.addComponent).to.be.a('function');
        });
        
        it('adds a component with [componentId] to the [entity]', function() {
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            expect(this.world.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            
            this.world.addComponent(this.entity, this.component);
            
            expect(this.world.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            expect(this.world.entities[this.entity]).property(this.component).to.be.an('object');
        });
        
        it('adds a dynamic component to the [entity] and instantiate it', function() {
            var dynamicComponent = this.world.registerComponent(Entities.World.ComponentType.Dynamic, 'Dynamic');
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.not.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.not.have.property(dynamicComponent);
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('adds a semi dynamic component to the [entity] and instantiate it', function() {
            var semiDynamicComponent = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, 'Semi dynamic');
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.not.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.not.have.property(semiDynamicComponent);
            
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a dynamic component twice if already instantiated when added (error situation)', function() {
            var dynamicComponent = this.world.registerComponent(Entities.World.ComponentType.Dynamic, 'Dynamic');
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
            
            this.world.addComponent(this.entity, dynamicComponent);
            
            expect(this.world.entities[this.entity].id & dynamicComponent).to.equal(dynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(dynamicComponent);
            expect(this.world.entities[this.entity]).property(dynamicComponent).to.not.be.null;
        });
        
        it('does not instatiate a semi dynamic component twice if already instantiated when added', function() {
            var semiDynamicComponent = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, 'Semi dynamic');
            
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
            
            this.world.entities[this.entity].id = 0;
            this.world.addComponent(this.entity, semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & semiDynamicComponent).to.equal(semiDynamicComponent);
            expect(this.world.entities[this.entity]).to.have.property(semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(semiDynamicComponent).to.not.be.null;
        });
        
        it('does not add a component with [componentId] if the component has not been registered', function() {
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 99);
            
            expect(this.world.entities[this.entity].id).to.equal(0);
            expect(this.world.entities[this.entity]).to.not.have.property(99);
        });
        
        it('does not add a component if [componentId] is not a valid input', function() {
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, null);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 'not a number');
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, []);
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, {});
            expect(this.world.entities[this.entity].id).to.equal(0);
            
            this.world.addComponent(this.entity, 1.2);
            expect(this.world.entities[this.entity].id).to.equal(0);
        });
    });
    
    describe('removeComponent(entity, componentId)', function() {
        beforeEach(function() {
            this.component = this.world.registerComponent(Entities.World.ComponentType.Static, { x : 10, y : 20 });
            this.semiDynamicComponent = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, { x : 10, y : 20 });
            this.dynamicComponent = this.world.registerComponent(Entities.World.ComponentType.Dynamic, { x : 10, y : 20 });
            this.entity = 0;
            
            this.world.addComponent(this.entity, this.component);
            this.world.addComponent(this.entity, this.semiDynamicComponent);
            this.world.addComponent(this.entity, this.dynamicComponent);
        });
        
        it('is a function', function() {
            expect(this.world.removeComponent).to.be.a('function');
        });
        
        it('removes a component', function() {
            expect(this.world.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entity, this.component);
            
            expect(this.world.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entity, this.semiDynamicComponent);
            
            expect(this.world.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entity, this.dynamicComponent);
            
            expect(this.world.entities[this.entity].id & this.component).to.not.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.not.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.not.equal(this.dynamicComponent);
        });
        
        it('leaves the actual component is but removes its id when a static component is removed', function() {
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            expect(this.world.entities[this.entity]).property(this.component).to.not.be.null;
            
            this.world.removeComponent(this.entity, this.component);
            
            expect(this.world.entities[this.entity]).to.have.property(this.component);
            expect(this.world.entities[this.entity]).property(this.component).to.not.be.null;
        });

        it('leaves the actual component is but removes its id when a semi dynamic component is removed', function() {
            expect(this.world.entities[this.entity]).to.have.property(this.semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(this.semiDynamicComponent).to.not.be.null;
            
            this.world.removeComponent(this.entity, this.semiDynamicComponent);
            
            expect(this.world.entities[this.entity]).to.have.property(this.semiDynamicComponent);
            expect(this.world.entities[this.entity]).property(this.semiDynamicComponent).to.not.be.null;
        });
        
        it('removes the actual component and its id when a dyanmic component is removed', function() {
            expect(this.world.entities[this.entity]).to.have.property(this.dynamicComponent);
            expect(this.world.entities[this.entity]).property(this.dynamicComponent).to.not.be.null;
            
            this.world.removeComponent(this.entity, this.dynamicComponent);
            
            expect(this.world.entities[this.entity]).to.have.property(this.dynamicComponent);
            expect(this.world.entities[this.entity]).property(this.dynamicComponent).to.be.null;
        });
        
        it('does not remove a component when a bad [comonentId] is passed in', function() {
            expect(this.world.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.equal(this.dynamicComponent);
            
            this.world.removeComponent(this.entity, 25);
            this.world.removeComponent(this.entity, -1);
            this.world.removeComponent(this.entity, 'not a number');
            this.world.removeComponent(this.entity);
            this.world.removeComponent(this.entity, null);
            this.world.removeComponent(this.entity, []);
            this.world.removeComponent(this.entity, {});
            
            expect(this.world.entities[this.entity].id & this.component).to.equal(this.component);
            expect(this.world.entities[this.entity].id & this.semiDynamicComponent).to.equal(this.semiDynamicComponent);
            expect(this.world.entities[this.entity].id & this.dynamicComponent).to.equal(this.dynamicComponent);
        });
    });
    
    describe('getFirstUnusedEntity()', function() {
        it('is a function', function() {
            expect(this.world.getFirstUnusedEntity).to.be.a('function');
        });
        
        it('returns 0 when there is no entity added', function() {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns correct entityId as more entities are added', function() {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            
            for (var i = 0; i < 20; ++i) {
                this.world.entities[i].id = 1;
                expect(this.world.getFirstUnusedEntity()).to.equal(i + 1);
            }
        });
        
        it('returns correct entityId when there is a gap in used entities', function() {
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            
            for (var i = 0; i < 20; ++i) {
                this.world.entities[i].id = 1;
            }
            
            this.world.entities[10].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            
            this.world.entities[15].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            expect(this.world.getFirstUnusedEntity()).to.equal(10);
            
            this.world.entities[10].id = 1;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(15);
            expect(this.world.getFirstUnusedEntity()).to.equal(15);
            
            this.world.entities[15].id = 1;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(20);
            expect(this.world.getFirstUnusedEntity()).to.equal(20);
            
            this.world.entities[0].id = 0;
            
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
            expect(this.world.getFirstUnusedEntity()).to.equal(0);
        });
        
        it('returns [capacity] when there is no entities left in the world', function() {
            for (var i = 0; i < this.world.capacity; ++i) {
                this.world.entities[i].id = 1;
            }
            
            expect(this.world.getFirstUnusedEntity()).to.equal(this.world.capacity);
        });
    });
    
    describe('increaseCapacity()', function() {
        beforeEach(function() {
            this.component = this.world.registerComponent(Entities.World.ComponentType.Static, { x : 10, y : 10 });
            this.semiDynamicComponent = this.world.registerComponent(Entities.World.ComponentType.SemiDynamic, { x : 10, y : 10 });
            this.dynamicComponent = this.world.registerComponent(Entities.World.ComponentType.Dynamic, { x : 10, y : 10 });
        });
        
        it('is a function', function() {
            expect(this.world.increaseCapacity).to.be.a('function');
        });
        
        it('increases capacity to be twice its old size', function() {
            expect(this.world.capacity).to.equal(100);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(200);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(400);
            
            this.world.increaseCapacity();
            
            expect(this.world.capacity).to.equal(800);
        });
        
        it('adds entities as capacity is increased', function() {
            expect(this.world.entities).property('length').to.equal(100);
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).to.be.an('object');
            }
        });
        
        it('adds static components to entities as capacity is increased', function() {
            expect(this.world.entities).property('length').to.equal(100);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
                expect(this.world.entities[i]).to.have.property(this.component);
                expect(this.world.entities[i]).to.not.have.property(this.semiDynamicComponent);
                expect(this.world.entities[i]).to.not.have.property(this.dynamicComponent);
            }
            
            this.world.increaseCapacity();
            
            expect(this.world.entities).property('length').to.equal(200);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
                expect(this.world.entities[i]).to.have.property(this.component);
                expect(this.world.entities[i]).to.not.have.property(this.semiDynamicComponent);
                expect(this.world.entities[i]).to.not.have.property(this.dynamicComponent);
            }
        });
    });
    
    describe('addEntity(entity, componentId)', function() {
        beforeEach(function() {
            this.posComponent  = this.world.registerComponent(Entities.World.ComponentType.Static, { x : 10, y : 20 });
            this.nameComponent = this.world.registerComponent(Entities.World.ComponentType.Static, { name : 'Testing' });
            this.velComponent  = this.world.registerComponent(Entities.World.ComponentType.Static, 5.5);
                              
            this.components = this.posComponent | this.nameComponent | this.velComponent;
        });
        
        it('is a function', function() {
            expect(this.world.addEntity).to.be.a('function');
        });
        
        it('adds and returns an entity, given correct [components] input', function() {
            var entity = this.world.addEntity(this.components);
            
            expect(this.entity).to.not.be.null;
            
            entity = this.world.addEntity(this.components, true);
            
            expect(this.entity).to.not.be.null;
        });

        it('does not add an entitty and returns null, given wrong [components] input', function() {
            var entity = this.world.addEntity();
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity('not a number');
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity('');
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity(null);
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity(-1);
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity(0);
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity({});
            
            expect(entity).to.be.null;
            
            entity = this.world.addEntity([]);
            
            expect(entity).to.be.null;
        });
        
        it('returns an index when [returnDetails] = false or omitted', function() {
            var entity = this.world.addEntity(this.components, false);
            expect(entity).to.be.a('number');
            
            entity = this.world.addEntity(this.components);
            expect(entity).to.be.a('number');
        });
        
        it('returns an entity object when [returnDetails] = true', function() {
            var entity = this.world.addEntity(this.components, true);
            expect(entity).to.be.an('object');
        });
        
        it('returns a entity containing [components]', function() {
            var entityIndex = this.world.addEntity(this.components);
            var entity = this.world.entities[entityIndex];
            
            expect(entity).property('id').to.equal(this.components);
            expect(entity).to.have.property(this.posComponent);
            expect(entity).property(this.posComponent).to.not.be.null;
            expect(entity).to.have.property(this.nameComponent);
            expect(entity).property(this.nameComponent).to.not.be.null;
            expect(entity).to.have.property(this.velComponent);
            expect(entity).property(this.velComponent).to.not.be.null;
        });
        
        it('returns a entity only containing registered [components] if on or more [components] are not registered', function() {
            var entityIndex = this.world.addEntity(1 | 16 | 32);
            var entity = this.world.entities[entityIndex];
            
            expect(entity).property('id').to.equal(1);
            expect(entity).to.have.property(1);
            expect(entity).property(1).to.be.an('object');
            expect(entity).to.not.have.property(16);
            expect(entity).to.not.have.property(32);
        });
    });
});
