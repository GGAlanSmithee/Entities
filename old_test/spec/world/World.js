var expect = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entites.World', function() {
    describe('constructor()', function() {
        beforeEach(function() {
            this.world = new Entities.World();
        });
        
        afterEach(function() {
            delete this.world;
        });
        
        it('is a function', function() {
            expect(Entities.World).to.be.a('function');
        });
        
        it('can be used to instantiate a new Entities.World', function() {
            expect(this.world).to.be.an.instanceof(Entities.World);
        });
        
        it('sets [capacity] to 100', function() {
            expect(this.world).property('capacity').to.equal(100);
        });
        
        it('creates 100 empty entities', function() {
            expect(this.world).property('entities').to.be.an('array');
            expect(this.world).property('entities').property('length').to.equal(100);
        });
        
        it('sets [currentMaxEntity] to 0', function() {
            expect(this.world.currentMaxEntity).to.equal(0);
        });
        
        it('registers only the "None" (0) component type', function() {
            expect(this.world.components).to.be.an('object');
            
            expect(this.world.components[0]).to.be.an('object');
            expect(this.world.components[0]).property('type').to.be.null;
            expect(this.world.components[0]).property('object').to.be.null;
        });
    });
    
    describe('constructor(capacity)', function() {
        beforeEach(function() {
            this.capacity = 2000;
            this.world = new Entities.World(this.capacity);
        });
        
        afterEach(function() {
            delete this.world;
        });
        
        it('sets [capacity] equal to the passed in value', function() {
            expect(this.world).property('capacity').to.equal(this.capacity);
        });
        
        it('creates [capacity] number of empty entities', function() {
            expect(this.world).property('entities').to.be.an('array');
            expect(this.world).property('entities').property('length').to.equal(this.capacity);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
            }
        });
        
        it('set [currentMaxEntity] to 0', function() {
            expect(this.world.currentMaxEntity).to.equal(0);
        });
        
        it('sets [capacity] to 100 (default) on bad input', function() {
            this.world = new Entities.World('bad input');
            
            expect(this.world.capacity).to.equal(100);
            expect(this.world).property('entities').property('length').to.equal(this.world.capacity);
            
            for (var i = 0; i < this.world.capacity; ++i) {
                expect(this.world.entities[i]).property('id').to.equal(0);
            }
        });
    });
});