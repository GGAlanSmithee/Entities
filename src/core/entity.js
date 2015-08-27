import ComponentManager              from './component';
import SystemManager, { SystemType } from './system';
import EventHandler                  from './event';

export const SelectorType = {
    Get         : 0,
    GetWith     : 1,
    GetWithOnly : 2,
    GetWithout  : 3
};

export default class EntityManager {
    constructor(capacity = 1000) {
        this.capacity         = capacity;
        this.currentMaxEntity = -1;
        
        this.entityFactory    = new EntityFactory();
        this.systemManager    = new SystemManager();
        this.componentManager = new ComponentManager();
        this.eventHandler     = new EventHandler();
        
        this.entities = Array.from({ length: this.capacity }, () => { return 0; } );
    }
    
    increaseCapacity() {
        let oldCapacity = this.capacity;
        
        this.capacity *= 2;
        
        for (let i = oldCapacity; i < this.capacity; ++i) {
            this.entities[i] = 0;
        }
        
        for (let componentId of this.componentManager.getComponents().keys()) {
            for (let i = oldCapacity; i < this.capacity; ++i) {
                this[componentId].push(this.componentManager.newComponent(componentId));
            }
        }
    }
    
    newEntity(components) {
        if (typeof components !== 'number' || components <= 0) {
            return this.capacity;
        }
        
        let entityId = 0;
        
        for (; entityId < this.capacity; ++entityId) {
            if (this.entities[entityId] === 0) {
                break;
            }
        }
        
        if (entityId >= this.capacity) {
            // todo: auto increase capacity?
            return this.capacity;
        }
        
        if (entityId > this.currentMaxEntity) {
            this.currentMaxEntity = entityId;
        }
        
        this.entities[entityId] = components;
        
        return entityId;
    }
    
    deleteEntity(entityId) {
        this.entities[entityId] = 0;
        
        if (entityId < this.currentMaxEntity) {
            return;
        }
        
        for (let i = entityId; i >= 0; --i) {
            if (this.entities[i] !== 0) {
                this.currentMaxEntity = i;
                
                return;
            }
        }
    }
    
    *getEntities(components = 0, type = SelectorType.GetWith) {
        switch (type) {
            case SelectorType.GetWith: {
                for (let entityId in this.entities) {
                    if (entityId > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entityId] !== 0 && (this.entities[entityId] & components) === components) {
                        yield Math.floor(entityId);
                    }
                }
                
                break;
            }
            case SelectorType.GetWithOnly: {
                for (let entityId in this.entities) {
                    if (entityId > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entityId] !== 0 && this.entities[entityId] === components) {
                        yield Math.floor(entityId);
                    }
                }
                
                break;
            }
            case SelectorType.GetWithout: {
                for (let entityId in this.entities) {
                    if (entityId > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entityId] !== 0 && (this.entities[entityId] & components) !== components) {
                        yield Math.floor(entityId);
                    }
                }
                
                break;
            }
            case SelectorType.Get: {
                for (let entityId in this.entities) {
                    if (entityId > this.currentMaxEntity) {
                        return;
                    }
                    
                    yield Math.floor(entityId);
                }
                
                break;
            }
        }
    }

    // Component Manager
    
    registerComponent(component) {
        let componentId = this.componentManager.registerComponent(component);
        
        this[componentId] = [];
        
        for (let i = 0; i < this.capacity; ++i) {
            this[componentId].push(this.componentManager.newComponent(componentId));
        }
        
        let initializer;

        switch (typeof component) {
            case 'function': initializer = component; break;
            case 'object': {
                initializer = function() {
                    for (let key of Object.keys(component)) {
                        this[key] = component[key];
                    }
                };
            
                break;
            }
            default: initializer = function() { return component; }; break;
        }
        
        this.entityFactory.registerInitializer(componentId, initializer);
        
        return componentId;
    }
    
    addComponent(entityId, componentId) {
        this.entities[entityId] |= componentId;
    }
    
    removeComponent(entityId, componentId) {
        this.entities[entityId] &= ~componentId;
    }
    
    // System Manager
    
    registerSystem(type, selector, components, callback) {
        return this.systemManager.registerSystem(type, selector, components, callback);
    }
    
    registerLogicSystem(selector, components, callback) {
        return this.systemManager.registerSystem(SystemType.Logic, selector, components, callback);
    }
    
    registerRenderSystem(selector, components, callback) {
        return this.systemManager.registerSystem(SystemType.Render, selector, components, callback);
    }
    
    removeSystem(systemId) {
        return this.systemManager.removeSystem(systemId);
    }
    
    onLogic(delta) {
        for (let system of this.systemManager.logicSystems.values()) {
            system.callback.call(this, this.getEntities(system.components, system.selector), delta);
        }
    }
    
    onRender(delta) {
        for (let system of this.systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntities(system.components, system.selector), delta);
        }
    }

    // Entity Factory
    
    registerInitializer(componentId, initializer) {
        this.entityFactory.registerInitializer(componentId, initializer);
    }
    
    build() {
        this.entityFactory.build();
        
        return this;
    }
    
    withComponent(componentId, initializer) {
        this.entityFactory.withComponent(componentId, initializer);
        
        return this;
    }
    
    createConfiguration() {
        return this.entityFactory.createConfiguration();
    }
    
    create(count, configuration) {
        return this.entityFactory.create(this, count, configuration);
    }
    
    // Event Handler
    
    listen(event, callback) {
        return this.eventHandler.listen(event, callback);
    }
    
    stopListen(eventId) {
        return this.eventHandler.stopListen(eventId);
    }
    
    trigger() {
        return this.eventHandler.trigger.call(this, ...arguments);
    }
    
    triggerDelayed() {
        return this.eventHandler.triggerDelayed.call(this, ...arguments);
    }
}

export class EntityFactory {
    constructor() {
        this.initializers  = new Map();
        this.configuration = new Map();
    }
    
    registerInitializer(componentId, initializer) {
        if (!Number.isInteger(componentId) || typeof initializer !== 'function') {
            return;
        }
        
        this.initializers.set(componentId, initializer);
    }
    
    build() {
        this.configuration = new Map();
        
        return this;
    }
    
    withComponent(componentId, initializer) {
        if (!Number.isInteger(componentId)) {
            return this;
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(componentId);
        }
        
        this.configuration.set(componentId, initializer);
        
        return this;
    }
    
    createConfiguration() {
        return this.configuration;
    }
    
    create(entityManager, count = 1, configuration = undefined) {
        if (!(entityManager instanceof EntityManager)) {
            return [];
        }
    
        configuration = configuration || this.configuration;

        let components = 0;
        
        for (let component of configuration.keys()) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entityId = entityManager.newEntity(components);
            
            if (entityId >= entityManager.capacity) {
                continue;
            }
            
            for (let [componentId, initializer] of configuration) {
                if (typeof initializer !== 'function') {
                    continue;
                }
                
                let result = initializer.call(entityManager[componentId][entityId]);
                
                if (typeof entityManager[componentId][entityId] !== 'function' && typeof entityManager[componentId][entityId] !== 'object' && result !== undefined) {
                    entityManager[componentId][entityId] = result;
                }
            }
            
            entities.push(entityId);
        }
        
        return entities.length === 1 ? entities[0] : entities;
    }
}