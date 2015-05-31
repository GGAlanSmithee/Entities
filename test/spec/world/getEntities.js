var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World', function() {
    describe('getEntities(world, returnDetails)', function() {
        beforeEach(function() {
            this.world = new Entities.World();
        });
        
        afterEach(function() {
            delete this.world;
        });
        
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
});