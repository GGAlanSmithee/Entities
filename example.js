// this is how it should work

import EntityManager from './src';

var entityManager = new EntityManager(10);

entityManager.registerComponent('pos', {
    x : 3,
    y : 4
});

entityManager.registerComponent('vel', 5);

entityManager.registerLogicSystem('movement', [ 'pos', 'vel' ], (entities, { delta }) => {
    for (var { id, entity } of entities) {
        console.log(id, entity);
    
        entity.pos.x += entity.vel * delta;
        entity.pos.y += entity.vel * delta;
    }
})

entityManager.build()
             .withComponent('pos')
             .withComponent('vel')
             .create(10);

entityManager.onLogic({ delta : 0.05 });
entityManager.onLogic({ delta : 0.05 });
