'use strict';

function Collision(args) {
    let world     = args[0].World;
    let entityOne = args[1];
    let entityTwo = args[2];
    
    console.log(world.Entities[entityOne]);
    console.log(world.Entities[entityTwo]);
}