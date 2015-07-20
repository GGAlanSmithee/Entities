import ComponentManager, { NoneComponent, ComponentType } from './Component';
import SystemManager                                      from './System';
import EventHandler                                       from './Event';

export const SelectorType = {
    Get         : 0,
    GetWith     : 1,
    GetWithOnly : 2,
    GetWithout  : 3
};

export default class EntityManager {
    constructor(capacity = 1000, entityFactory = new EntityFactory(), systemManager = new SystemManager(), componentManager = new ComponentManager(), eventHandler = new EventHandler()) {
        this.entityFactory    = entityFactory;
        this.systemManager    = systemManager;
        this.componentManager = componentManager;
        this.eventHandler     = eventHandler;
        this.capacity         = Number.isInteger(capacity) ? capacity : 1000;
    
        this.currentMaxEntity = -1;
        
        this.entities = Array.from({length: this.capacity}, v => v = { id : 0 });
    }
    
    registerComponent(object, initializer, type = ComponentType.Static) {
        let component = this.componentManager.registerComponent(object, type);

        if (type === ComponentType.Static) {
            this.entities.forEach(entity => entity[component] = this.componentManager.newComponent(object));
        }
        
        if (typeof initializer === 'function') {
            this.entityFactory.registerInitializer(component, initializer);
        }
        
        return component;
    }
    
    increaseCapacity() {
        this.capacity *= 2;
        
        for (let i = this.capacity / 2; i < this.capacity; ++i) {
            this.entities[i] = { id : 0 };

            for (let [key, component] of this.componentManager.getComponents()) {
                if (component.type === ComponentType.Static) {
                    this.entities[i][key] = this.componentManager.newComponent(component.object);
                }
            }
        }
    }
    
    addEntity(components, returnDetails = false) {
        if (typeof components !== 'number' || components <= 0) {
            return returnDetails ? null : this.capacity;
        }
        
        let entityId = this.getFirstUnusedEntity();
        
        if (entityId >= this.capacity) {
            return returnDetails ? null : this.capacity;
        }
        
        if (entityId > this.currentMaxEntity) {
            this.currentMaxEntity = entityId;
        }
        
        let entity = this.entities[entityId];
        
        let componentKeys = this.componentManager.getComponents().keys();
        
        for (let component of componentKeys) {
            if (component !== NoneComponent && (components & component) === component) {
                this.componentManager.addComponentToEntity(entity, component);
            } else {
                this.componentManager.removeComponentFromEntity(entity, component);
            }
        }
        
        return returnDetails ? entity : entityId;
    }
    
    deleteEntity(entity) {
        if (!Number.isInteger(entity)) {
            return;
        }
        
        let componentKeys = this.componentManager.getComponents().keys();
        
        for (let key of componentKeys) {
            if (key !== NoneComponent) {
                this.componentManager.removeComponentFromEntity(this.entities[entity], key);
            }
        }
        
        if (entity <= this.currentMaxEntity) {
            return;
        }
        
        for (let i = entity; i >= 0; --i) {
            if (this.entities[i].id !== NoneComponent) {
                this.currentMaxEntity = i;
                
                break;
            }
        }
    }
    
    getFirstUnusedEntity(returnDetails = false) {
        for (let entity in this.entities) {
            if (this.entities[entity].id === NoneComponent) {
                return returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
        
        return returnDetails ? null : this.capacity;
    }
    
    *getEntities(type = SelectorType.Get, components = NoneComponent, returnDetails = false) {
        switch (type) {
            case SelectorType.GetWith: {
                for (let entity in this.entities) {
                    if (entity > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) === components) {
                        yield returnDetails ? this.entities[entity] : Math.floor(entity);
                    }
                }
                
                break;
            }
            case SelectorType.GetWithOnly: {
                for (let entity in this.entities) {
                    if (entity > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entity].id !== NoneComponent && this.entities[entity].id === components) {
                        yield returnDetails ? this.entities[entity] : Math.floor(entity);
                    }
                }
                
                break;
            }
            case SelectorType.GetWithout: {
                for (let entity in this.entities) {
                    if (entity > this.currentMaxEntity) {
                        return;
                    }
                    
                    if (this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) !== components) {
                        yield returnDetails ? this.entities[entity] : Math.floor(entity);
                    }
                }
                
                break;
            }
            default: {
                for (let entity in this.entities) {
                    if (entity > this.currentMaxEntity) {
                        return;
                    }
                    
                    yield returnDetails ? this.entities[entity] : Math.floor(entity);
                }
            }
        }
    }
    
    withComponent : function(component, initializer) {
        this.factory.withComponent(component, initializer);
        
        return this;
    },
    
    createConfiguration : function() {
        return this.factory.createConfiguration();
    },
    
    create : function(count, configuration) {
        return this.factory.create(this.world, count, configuration);
    }
}

export class EntityFactory {
    constructor() {
        this.initializers  = new Map();
        this.configuration = new Map();
    }
    
    registerInitializer(component, initializer) {
     if (!Number.isInteger(component) || typeof initializer !== 'function') {
            return;
        }
        
        this.initializers.set(component, initializer);
    }
    
    build() {
        this.configuration = new Map();
        
        return this;
    }
    
    withComponent(component, initializer) {
        if (!Number.isInteger(component)) {
            return this;
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(component);
        }
        
        this.configuration.set(component, initializer);
        
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

        let components = NoneComponent;
        
        for (let component of configuration.keys()) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entity = entityManager.addEntity(components, true);
            
            if (!entity) {
                continue;
            }
                
            for (let [component, initializer] of configuration) {
                if (!initializer) {
                    continue;
                }

                let result = initializer.call(entity[component]);
                
                if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                    entity[component] = result;
                }
            }
            
            entities.push(entity);
        }
        
        return entities;
    }
}