describe('Entites.World', function() {
    beforeEach(function() {
        this.world = new Entities.World();
    });
    
    it('is defined as a function', function() {
        expect(typeof Entities.World).toBe('function');
    });
    
    it('can be instantiated', function() {
        expect(this.world instanceof Entities.World).toBe(true);
    });
    
    it('default capacity is 100', function() {
        expect(this.world.capacity).toBe(100);
    });
    
    it('current max entity starts as 0', function() {
        expect(this.world.currentMaxEntity).toBe(0);
    });
    
    it('capacity # of empty entities are created', function() {
        expect(this.world.entities.length).toBe(100);
        
        for (var i = 0; i < 100; ++i) {
            expect(this.world.entities[i].id).toBe(0);
            expect(this.world.entities[i].index).toBe(i);
        }
    });
    
    it('components contains only the "None" (0) component', function() {
        expect(typeof this.world.components).toBe('object');
        expect(Array.isArray(this.world.components)).toBe(true);
        
        expect(typeof this.world.components['0']).toBe('object');
        expect(this.world.components['0'].type).toBe(null);
        expect(this.world.components['0'].object).toBe(null);
    });
});