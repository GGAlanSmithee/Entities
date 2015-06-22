import { World, ComponentType, NoneComponent } from './dist/es6';

let world = new World(1000);

console.log(world.getNextComponentId());
console.log(NoneComponent);
console.log(ComponentType);

world.currentMaxEntity = 20;

for (let entity of world.getEntities()) {
    console.log(entity);
}