import { ComponentType } from '../src/core/Component';
import { SelectorType }  from '../src/core/Entity';
import { SystemType }    from '../src/core/System';

export function registerComponent(componentManager, entityManager, component, componentId) {
    entityManager[componentId] = [];
    
    for (let i = 0; i < entityManager.capacity; ++i) {
        entityManager[componentId].push(component);
    }
    
    componentManager.components.set(componentId, component);
    
    return componentId;
}

export function addComponentToEntity(entityManager, componentManager, entityId, componentId) {
    entityManager.entities[entityId] |= componentId;
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