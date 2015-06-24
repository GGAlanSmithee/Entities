export function registerComponent(world, type, object, id) {
    world.components.set(id, { type, object });
    
    return id;
}

export function addComponentToEntity(world, entityId, componentId) {
    world.entities[entityId].id |= componentId;
    world.entities[entityId][componentId] = world.components.get(componentId).object;
}