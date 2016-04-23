// this is how it should work

import GGEntities from './src';

var entityManager = new GGEntities.EntityManager();

entityManager.registerComponent('pos', {
    x : 0,
    y : 0
});

entityManager.registerComponent('vel', {
    x: 10,
    y: 10
});

entityManager.registerLogicSystem('movement', [ 'pos', 'vel' ], (entities, { delta }) => {
    for (var { id, entity } of entities) { // yields both id and entity as an object
        console.log(id);
        
        entity.pos.x += entity.vel * delta;
        entity.pos.y += entity.vel * delta;
    }
})

entityManager.build().withComponents([ 'pos', 'vel' ]).create(10);

entityManager.onLogic();
