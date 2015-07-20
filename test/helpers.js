import { ComponentType } from '../src/core/Component';
import { SelectorType }  from '../src/core/Entity';
import { SystemType }    from '../src/core/System';

export function registerComponent(componentManager, entityManager, type, object, id) {
    if (type === ComponentType.Static) {
        for (let entity of entityManager.entities) {
            entity[id] = { type, object };
        }
    }
    
    componentManager.components.set(id, { type, object });
    
    return id;
}

export function addComponentToEntity(entityManager, componentManager, entityId, componentId) {
    entityManager.entities[entityId].id |= componentId;
    entityManager.entities[entityId][componentId] = componentManager.components.get(componentId).object;
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