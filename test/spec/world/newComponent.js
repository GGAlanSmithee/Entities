describe('Entities.World.newComponent', function() {
    it('is defined as a function', function() {
        expect(typeof Entities.World.newComponent).toBe('function');
    });
    
    it('creates a new component from an object', function() {
        var component = Entities.World.newComponent({ x : 10 });
        
        expect(typeof component).toBe('object');
        expect(component.x).toBe(10);
        expect(component.y).toBe(undefined);
    });
    
    it('creates a new component from a function', function() {
        var component = Entities.World.newComponent(function() { this.x = 10; });
        
        expect(typeof component).toBe('object');
        expect(component.x).toBe(10);
        expect(component.y).toBe(undefined);
    });
    
    it('creates a new component from an int', function() {
        var component = Entities.World.newComponent(5);
        
        expect(typeof component).toBe('number');
        expect(component).toBe(5);
    });
    
    it('creates a new component from a float', function() {
        var component = Entities.World.newComponent(5.5);
        
        expect(typeof component).toBe('number');
        expect(component).toBe(5.5);
    });
    
    it('creates a new component from a string', function() {
        var component = Entities.World.newComponent('test');
        
        expect(typeof component).toBe('string');
        expect(component).toBe('test');
    });
    
    it('throws error on null input', function() {
        expect(function() { Entities.World.newComponent(null); }).toThrow(new TypeError('cannot create a component from ' + null));
    });
    
    it('throws error on no input', function() {
        expect(function() { Entities.World.newComponent(); }).toThrow(new TypeError('cannot create a component from ' + undefined));
    });
});