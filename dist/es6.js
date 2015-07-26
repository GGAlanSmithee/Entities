'use strict';

class ComponentManager {
    constructor() {
        this.components = new Map();
    }
    
    newComponent(componentId) {
        let component = this.components.get(componentId);
        
        if (component === null || component === undefined) {
            return null;
        }
        
        switch (typeof component) {
            case 'function': return new component();
            case 'object'  : {
                return ((component) => {
                    let ret = {};
                    
                    Object.keys(component).forEach(key => ret[key] = component[key]);
                    
                    return ret;
                })(component);
            }
        }
        
        return component;
    }
    
    registerComponent(component) {
        if (component === null || component === undefined) {
            throw TypeError('component cannot be null.');
        }
        
        let max = Math.max(...this.components.keys());
        
        let id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2;

        this.components.set(id, component);

        return id;
    }
    
    getComponents() {
        return this.components;
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
    
    addSystem(callback, components = 0, type = SystemType.Logic, selector = SelectorType.GetWith) {
    	if (typeof callback !== 'function') {
    		throw TypeError('callback must be a function.');
    	}
    	
    	let system = {
    		selector,
    		components,
    		callback
    	};
    
        let systemId = -1;
        
        this.systems.forEach(sys => {
            systemId = Math.max(systemId, ...sys.keys());
        });
        
        ++systemId;
    	
    	this.systems.get(type).set(systemId, system);

    	return systemId;
    }
    
    removeSystem(systemId) {
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === systemId) {
                    return typeSystem.delete(systemId);
                }
            }
        }

        return false;
    }
    
    getSystem(systemId) {
        for (let typeSystem of this.systems.values()) {
            for (let id of typeSystem.keys()) {
                if (id === systemId) {
                    return typeSystem.get(systemId);
                }
            }
        }
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
    
    listen(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, new Map());
        }
        
        let eventId = -1;
        
        this.events.forEach(event => {
            eventId = Math.max(eventId, ...event.keys());
        });
        
        ++eventId;
        
        this.events.get(event).set(eventId, callback);
        
        return eventId;
    }
    
    stopListen(eventId) {
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
    constructor(capacity = 1000) {
        this.capacity         = capacity;
        this.currentMaxEntity = -1;
        
        this.entityFactory    = new EntityFactory();
        this.systemManager    = new SystemManager();
        this.componentManager = new ComponentManager();
        this.eventHandler     = new EventHandler();
        
        this.entities = Array.from({ length: this.capacity }, v => v = 0);
    }
    
    registerComponent(component, initializer) {
        let componentId = this.componentManager.registerComponent(component);
        
        this[componentId] = [];
        
        for (let i = 0; i < this.capacity; ++i) {
            this[componentId].push(this.componentManager.newComponent(componentId));
        }
        
        if (typeof initializer === 'function') {
            this.entityFactory.registerInitializer(componentId, initializer);
        }
        
        return componentId;
    }
    
    addComponent(entityId, componentId) {
        this.entities[entityId] |= componentId;
    }
    
    removeComponent(entityId, componentId) {
        this.entities[entityId] &= ~componentId;
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
    
    *getEntities(type = SelectorType.Get, components = 0) {
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
            default: {
                for (let entityId in this.entities) {
                    if (entityId > this.currentMaxEntity) {
                        return;
                    }
                    
                    yield Math.floor(entityId);
                }
            }
        }
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
}

class EntityFactory {
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
            initializer = this.initializers.get(componentId) || function() { };
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
        
        return entities;
    }
}

var Entities = EntityManager;

exports['default'] = Entities;