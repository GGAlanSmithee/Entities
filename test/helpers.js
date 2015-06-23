import { ComponentType } from '../src/core/Component';

export function registerStaticComponent(context, world, id) {
    context.staticComponent = id;
    world.components.set(id, { type : ComponentType.Static, object : { x : 10, y : 20 } });
}

export function registerSemiDynamicComponent(context, world, id) {
    context.semiDynamicComponent = id;
    world.components.set(id, { type : ComponentType.SemiDynamic, object : { x : 10, y : 20 } });
}

export function registerDynamicComponent(context, world, id) {
    context.dynamicComponent = id;
    world.components.set(id, { type : ComponentType.Dynamic, object : { x : 10, y : 20 } });
}

export function addAndGetEntityId(context) {
    return (context.entityId = 0);
}

export function addComponentToEntity(world, entityId, componentId) {
    world.entities[entityId].id |= componentId;
    world.entities[entityId][componentId] = world.components.get(componentId).object;
}