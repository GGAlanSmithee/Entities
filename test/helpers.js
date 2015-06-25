import { ComponentType } from '../src/core/Component';

export function registerComponent(world, type, object, id) {
    if (type === ComponentType.Static) {
        for (let entity of world.entities) {
            entity[id] = { type, object };
        }
    }
    
    world.components.set(id, { type, object });
    
    return id;
}

export function addComponentToEntity(world, entityId, componentId) {
    world.entities[entityId].id |= componentId;
    world.entities[entityId][componentId] = world.components.get(componentId).object;
}