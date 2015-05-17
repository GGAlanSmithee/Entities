describe('Entities.World.getEntities', function() {
    beforeEach(function() {
        this.world = new Entities.World();
    });
    
    it('is defined as a function', function() {
        expect(typeof Entities.World.getEntities).toBe('function');
    });
    
    it('when returnDetails is true, all entities are returned', function() {
        var entities = Entities.World.getEntities(this.world, true);
        
        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(100);
    });
    
    it('when returnDetails is false, all entities with components up to current max entity are returned', function() {
        var entities = Entities.World.getEntities(this.world, false);
        
        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(0);
        
        this.world.currentMaxEntity = 10;
        this.world.entities[2].id |= 1;
        this.world.entities[4].id |= 4;
        this.world.entities[5].id |= 2;
        
        entities = Entities.World.getEntities(this.world, false);
        
        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(3);
        
        this.world.currentMaxEntity = 20;
        this.world.entities[11].id |= 2;
        this.world.entities[12].id |= 2;
        this.world.entities[17].id |= 8;
        
        entities = Entities.World.getEntities(this.world, false);
        
        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(6);
    });
    
    it('throws an exception on bad input', function() {
        expect(function() { Entities.World.getEntities(1); }).toThrow(new TypeError('world argument must be an instance of Entities.World'));
        expect(function() { Entities.World.getEntities({}); }).toThrow(new TypeError('world argument must be an instance of Entities.World'));
        expect(function() { Entities.World.getEntities(Entities); }).toThrow(new TypeError('world argument must be an instance of Entities.World'));
        expect(function() { Entities.World.getEntities(null); }).toThrow(new TypeError('world argument must be an instance of Entities.World'));
        expect(function() { Entities.World.getEntities(); }).toThrow(new TypeError('world argument must be an instance of Entities.World'));
    });
});