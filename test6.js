import { SystemManager, World, ComponentType, NoneComponent } from './dist/es6';

console.log(SystemManager);

let world = new World(1000);

console.log(world.getNextComponentId());
console.log(NoneComponent);
console.log(ComponentType);

world.currentMaxEntity = 20;

for (let entity of world.getEntities()) {
    console.log(entity);
}