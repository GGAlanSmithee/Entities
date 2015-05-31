var expect   = require("chai").expect;
var Entities = require('../../../dist/Entities');

describe('Entities.World', function() {
    describe('getNextComponentTypeId(components)', function() {
        beforeEach(function() {
            this.world = new Entities.World();
        });
        
        afterEach(function() {
            delete this.world;
        });
        
        it('is a function', function() {
            expect(Entities.World.getNextComponentTypeId).to.be.a('function');
        });
        
        it('returns the correct component type id under normal circumstances', function() {
            var components = [
                { id : 0 },
                { id : 1 },
                { id : 2 },
                { id : 4 }
            ];
            
            var nextComponent = Entities.World.getNextComponentTypeId(components);
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component type id when there is a gap in the existing ids', function() {
            var components = [
                { id : 0 },
                { id : 4 }
            ];
            
            var nextComponent = Entities.World.getNextComponentTypeId(components);
            
            expect(nextComponent).to.equal(8);
        });
        
        it('returns the correct component type id when only the "None" component exists', function() {
            expect(Entities.World.getNextComponentTypeId([{ id : 0 }])).to.equal(1);
        });
        
        it('returns the correct component type id when there is no prior components', function() {
            expect(Entities.World.getNextComponentTypeId([])).to.equal(0);
        });
        
        it('returns the "None" component type id on bad input', function() {
            expect(Entities.World.getNextComponentTypeId()).to.equal(0);
            expect(Entities.World.getNextComponentTypeId('notanarray')).to.equal(0);
            expect(Entities.World.getNextComponentTypeId({})).to.equal(0);
            expect(Entities.World.getNextComponentTypeId(null)).to.equal(0);
        });
    });
});