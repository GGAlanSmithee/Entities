import { ComponentType } from '../src/core/Component';
import { SelectorType }  from '../src/core/World';
import { SystemType }    from '../src/core/System';

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

export function registerSystem(systemManager, systemId, components, callback, type, selector) {
    if (components === undefined || components === null) {
        components = 1 | 2 | 4;
    }
    
    if (callback === undefined || callback === null) {
        callback = () => { };
    }
    
    if (type === null || type === undefined) {
        type = SystemType.Init;
    }
    
    if (selector === null || selector === undefined) {
        selector = SelectorType.GetWith;
    }
    
    systemManager.systems.get(type).set(systemId, {
        callback,
        selector,
        components
    });
}