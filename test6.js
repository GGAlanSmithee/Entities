import { World, ComponentType, NoneComponent } from './dist/es6';

var world = new World(1000);

console.log(world.getNextComponentId());
console.log(NoneComponent);
console.log(ComponentType);

world.currentMaxEntity = 20;

for (var entity of world.getEntities()) {
    console.log(entity);
}