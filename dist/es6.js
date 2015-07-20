'use strict';

var _core_Event = require('.core/Event');
_core_Event = ('default' in _core_Event ? _core_Event['default'] : _core_Event);

const NoneComponent = 0;

const ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

class ComponentManager {
    constructor() {
        this.components = new Map();
        this.components.set(NoneComponent, { type : null, object : null });
    }
    
    newComponent(object) {
        if (object === null || object === undefined) {
            return null;
        }
        
        switch (typeof object) {
            case 'function': return new object();
            case 'object'  : {
                return ((object) => {
                    let ret = {};
                    
                    Object.keys(object).forEach(key => ret[key] = object[key]);
                    
                    return ret;
                })(object);
            }
        }
        
        return object;
    }
    
    registerComponent(object, initializer, type = ComponentType.Static, returnDetails = false) {
        if (object === null || object === undefined) {
            throw TypeError('object cannot be null.');
        }
        
        let max = Math.max(...this.components.keys());
        
        let id = max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
        
        let component = { type, object };
        
        this.components.set(id, component);

        return returnDetails ? component : id;
    }
    
    addComponentToEntity(entity, componentId) {
        if (typeof entity !== 'object' || entity === null) {
            return;
        }
        
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }

        if ((entity.id & componentId) !== componentId) {
            entity.id |= componentId;
        }
        
        if (component.type === ComponentType.Static || (entity[componentId] !== null && entity[componentId] !== undefined)) {
            return;
        }

        entity[componentId] = this.newComponent(component.object);
    }
    
    removeComponentFromEntity(entity, componentId) {
        if (typeof entity !== 'object' || entity === null) {
            return;
        }
        
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }
        
        if ((entity.id & componentId) === componentId) {
            entity.id &= ~componentId;
            
            if (component.type === ComponentType.Dynamic && entity[componentId] !== null && entity[componentId] !== undefined) {
                delete entity[componentId];
            }
        }
    }
    
    getComponents() {
        return this.components;
    }
}

class EventHandler {
    constructor() {
        this.events = new Map();
    }
    
    emptyPromise() {
        return new Promise(function(resolve, reject) {
            resolve();
        });
    }
    
    promise(callback, context, args, timeout) {
        if (timeout) {
            return new Promise(function(resolve, reject) {
                setTimeout(function(){
                    resolve(typeof context ===  'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
                }, timeout);
            });
        }
        
        return new Promise(function(resolve, reject) {
            resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
        });
    }
    
    getNextEventId() {
        let max = -1;
        
        this.events.forEach(event => {
            max = Math.max(max, ...event.keys());
        });
        
        return max + 1;
    }
    
    listen(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, new Map());
        }
        
        let eventId = this.getNextEventId();
        
        this.events.get(event).set(eventId, callback);
        
        return eventId;
    }
    
    stopListen(eventId) {
        if (!Number.isInteger(eventId)) {
            return false;
        }

        for (let events of this.events.values()) {
            for (let id of events.keys()) {
                if (id === eventId) {
                    return events.delete(eventId);
                }
            }
        }

        return false;
    }
    
    trigger() {
        let args  = arguments;
        let event = Array.prototype.splice.call(args, 0, 1)[0];
        
        let self    = this instanceof EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (typeof event !== 'string' || !self.events.has(event)) {
            return self.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, context, args));
        }
        
        return Promise.all(promises);
    }
    
    triggerDelayed() {
        let args    = arguments;
        
        let event   = Array.prototype.splice.call(args, 0, 1)[0];
        let timeout = Array.prototype.splice.call(args, 0, 1)[0];
        
        let self    = this instanceof EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
            return self.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, context, args, timeout));
        }
        
        return Promise.all(promises);
    }
}

const SelectorType = {
    Get         : 0,
    GetWith     : 1,
    GetWithOnly : 2,
    GetWithout  : 3
};

class EntityManager {
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
}

class EntityFactory {
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

const SystemType = {
    Init    : 0,
    Logic   : 1,
    Render  : 2,
    CleanUp : 3
};

class SystemManager {
    constructor() {
        this.systems = new Map();
        
        this.systems.set(SystemType.Init,    new Map());
        this.systems.set(SystemType.Logic,   new Map());
        this.systems.set(SystemType.Render,  new Map());
        this.systems.set(SystemType.CleanUp, new Map());
    }
    
    addSystem(callback, components = NoneComponent, type = SystemType.Logic, selector = SelectorType.GetWith) {
    	if (typeof callback !== 'function') {
    		throw TypeError('callback must be a function.');
    	}
    	
    	if (!Number.isInteger(components) || components === NoneComponent) {
    		components = NoneComponent;
    		selector = SelectorType.Get;
    	}
    	
    	let system = {
    		selector,
    		components,
    		callback
    	};
    
        let maxId = -1;
        
        this.systems.forEach(system => {
            maxId = Math.max(maxId, ...system.keys());
        });
        
        let systemId = maxId + 1;
    	
    	this.systems.get(type).set(systemId, system);

    	return systemId;
    }
    
    removeSystem(system) {
        if (!Number.isInteger(system)) {
            return false;
        }

        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === system) {
                    return typeSystem.delete(system);
                }
            }
        }

        return false;
    }
    
    getSystem(system) {
        if (!Number.isInteger(system)) {
            return;
        }
        
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === system) {
                    return typeSystem.get(system);
                }
            }
        }
    }
}

var Entities = { NoneComponent,
                 ComponentType,
                 SelectorType,
                 SystemManager,
                 SystemType,
                 EventHandler,
                 EntityManager,
                 EntityFactory };

exports['default'] = Entities;