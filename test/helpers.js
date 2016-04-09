import { SelectorType } from '../src/core/entity';
import { SystemType }   from '../src/core/system';

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

export function registerSystem(systemManager,
                               systemId,
                               type       = SystemType.Logic,
                               components = 1 | 2 |4,
                               callback   = function() {}, 
                               selector   = SelectorType.GetWith) {
    let system = {
        callback,
        selector,
        components
    };
    
    switch (type) {
        case SystemType.Logic:  systemManager.logicSystems.set(systemId, system);  break;
        case SystemType.Render: systemManager.renderSystems.set(systemId, system); break;
        case SystemType.Init:   systemManager.initSystems.set(systemId, system); break;
    }
}