'use strict';

function CollisionAgain(args) {
    let world     = args[0].World;
    let entityOne = args[1];
    let entityTwo = args[2];
    
    console.log('again ' + world.Entities[entityOne]);
    console.log('again ' + world.Entities[entityTwo]);
}