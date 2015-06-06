var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World', function() {
    beforeEach(function() {
        this.world = new Entities.World();
    });
    
    afterEach(function() {
        delete this.world;
    });
        
    describe('getEntities(world, returnDetails)', function() {
        it('is a function', function() {
            expect(Entities.World.getEntities).to.be.a('function');
        });
        
        it('returns all entities when [returnDetails] = true', function() {
            var entities = Entities.World.getEntities(this.world, true);
            
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(100);
        });
        
        it('returns entities as objects when [returnDetails] = true', function() {
            var entity = Entities.World.getEntities(this.world, true)[0];
            
            expect(entity).to.be.an('object');
            
            expect(entity).to.have.property('index');
            expect(entity).property('index').to.equal(0);
            
            expect(entity).to.have.property('id');
            expect(entity).property('id').to.equal(0);
        });
        
        it('returns all entities <= [currentMaxEntity] with one or more components when [returnDetails] = false', function() {
            var entities = Entities.World.getEntities(this.world, false);
            
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            this.world.currentMaxEntity = 10;
            this.world.entities[2].id |= 1;
            this.world.entities[4].id |= 4;
            this.world.entities[5].id |= 2;
            
            entities = Entities.World.getEntities(this.world, false);
            
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(3);
            
            this.world.currentMaxEntity = 20;
            this.world.entities[11].id |= 2;
            this.world.entities[12].id |= 2;
            this.world.entities[17].id |= 8;
            
            entities = Entities.World.getEntities(this.world, false);
            
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(6);
            
            this.world.currentMaxEntity = 15;
            
            entities = Entities.World.getEntities(this.world, false);
            
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(5);
        });
        
        it('returns entity indexes when [returnDetails] = false', function() {
            this.world.currentMaxEntity = 10;
            this.world.entities[0].id |= 1;
            
            var entity = Entities.World.getEntities(this.world, false)[0];
            
            expect(entity).to.be.a('number');
            expect(entity).to.equal(0);
            
            this.world.entities[5].id |= 3;
            
            entity = Entities.World.getEntities(this.world, false)[1];
            
            expect(entity).to.be.a('number');
            expect(entity).to.equal(5);
        });
        
        it('returns an empty array if [world] is not of type Entities.World', function() {
            var entities = Entities.World.getEntities(1);
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            entities = Entities.World.getEntities({});
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            entities = Entities.World.getEntities(Entities);
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            entities = Entities.World.getEntities(null);
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            entities = Entities.World.getEntities();
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
            
            entities = Entities.World.getEntities("entities");
            expect(entities).to.be.an('array');
            expect(entities).property('length').to.equal(0);
        });
    });
    
    describe('getNextComponentTypeId(components)', function() {
        it('is a function', function() {
            expect(Entities.World.getNextComponentTypeId).to.be.a('function');
        });
        
        it('returns the correct component type id under normal circumstances', function() {
            var components = {
                0 : { },
                1 : { },
                2 : { },
                4 : { }
            };
            
            var nextComponent = Entities.World.getNextComponentTypeId(components);
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component type id when there is a gap in the existing ids', function() {
            var components = {
                0 : { },
                4 : { }
            };
            
            var nextComponent = Entities.World.getNextComponentTypeId(components);
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component type id when only the "None" component exists', function() {
            expect(Entities.World.getNextComponentTypeId({ 0 : { } })).to.equal(1);
        });
        
        it('returns the correct component type id when there is no prior components', function() {
            expect(Entities.World.getNextComponentTypeId({})).to.equal(0);
        });
        
        it('returns the "None" component type id on bad input', function() {
            expect(Entities.World.getNextComponentTypeId()).to.equal(0);
            expect(Entities.World.getNextComponentTypeId('notanarray')).to.equal(0);
            expect(Entities.World.getNextComponentTypeId({})).to.equal(0);
            expect(Entities.World.getNextComponentTypeId(null)).to.equal(0);
        });
    });
    
    describe('newComponent(object)', function() {
        it('is a function', function() {
            expect(Entities.World.newComponent).to.be.a('function');
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