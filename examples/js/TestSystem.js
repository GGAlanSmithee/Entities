'use strict';

function Logic(world) {
    world.getEntities([ world.ComponentType.Test ]).forEach(function(entity) {
        var test = world.Test[entity];
        
        test.Rect.x += 10;
    });
}

GG.SystemManager.registerSystem(GG.SystemManager.Type.Logic, Logic);