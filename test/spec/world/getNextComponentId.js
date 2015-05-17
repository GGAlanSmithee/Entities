describe('Entities.World.getNextComponentId', function() {
    it('is defined as a function', function() {
        expect(typeof Entities.World.getNextComponentId).toBe('function');
    });
    
    it('returns the correct id under normal circumstances', function() {
        expect(Entities.World.getNextComponentId([
            { id : 0 },
            { id : 1 },
            { id : 2 },
            { id : 4 }
        ])).toBe(8);
    });
    
    it('returns the correct id when there is a gap in the existing ids', function() {
        expect(Entities.World.getNextComponentId([
            { id : 0 },
            { id : 4 }
        ])).toBe(8);
    });
    
    it('returns the correct id when only the "None" component exists', function() {
        expect(Entities.World.getNextComponentId([{ id : 0 }])).toBe(1);
    });
    
    it('returns the correct id when there is no prior components', function() {
        expect(Entities.World.getNextComponentId([])).toBe(0);
    });
    
    it('throws an exception on bad input', function() {
        expect(function() { Entities.World.getNextComponentId(null); }).toThrow(new TypeError('components argument must be an array'));
        expect(function() { Entities.World.getNextComponentId({  }); }).toThrow(new TypeError('components argument must be an array'));
    });
});