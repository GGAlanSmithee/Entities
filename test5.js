"use strict";
require("babel/polyfill");
var World         = require('./dist/es5').World;

var world = new World(1000);

console.log(world.entities[2]);
console.log(world.getNextComponentId());

world.currentMaxEntity = 20;

var entities = world.getEntities();

while (true) {
    var entity = entities.next();
    
    if (entity.done) {
        break;
    }
    
    console.log(entity.value);
}