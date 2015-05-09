function Logic(world) {
    world.getEntities([ world.ComponentType.Test, world.ComponentType.TestTwo ]).forEach(function(entity) {
        var test    = world.Test[entity];
        var testTwo = world.TestTwo[entity];
        
        test.Rect.x += 10;
        testTwo.Name = 'Test ' + test.Rect.x;
        
        console.log(testTwo.Name);
    });
}