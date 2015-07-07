'use strict';

var _core_Event = require('.core/Event');
_core_Event = ('default' in _core_Event ? _core_Event['default'] : _core_Event);

const NoneComponent = 0;

const ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

const SelectorType = {
    Get         : 0,
    GetWith     : 1,
    GetWithOnly : 2,
    GetWithout  : 3
};

class World {
    constructor(capacity) {
        this.capacity = typeof capacity === 'number' ? capacity : 100;
    
        this.currentMaxEntity = -1;
        
        this.entities = Array.from({length: this.capacity}, v => v = { id : 0 });
        
        this.components = new Map();
        this.components.set(NoneComponent, { type : null, object : null });
    }

    increaseCapacity() {
        this.capacity *= 2;
        
        for (let i = this.capacity / 2; i < this.capacity; ++i) {
            this.entities[i] = { id : 0 };

            for (let [key, component] of this.components) {
                if (component.type === ComponentType.Static) {
                    this.entities[i][key] = this.newComponent(component.object);
                }
            }
        }
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
    
    registerComponent(object, type = ComponentType.Static, returnDetails = false) {
        if (object === null || object === undefined) {
            throw TypeError('object cannot be null.');
        }
        
        let max = Math.max(...this.components.keys());
        
        let id = max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
        
        this.components.set(id, { type, object });

        if (type === ComponentType.Static) {
            this.entities.forEach(entity => entity[id] = this.newComponent(object));
        }
        
        return returnDetails ? this.components.get(id) : id;
    }
    
    addComponent(entity, componentId) {
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }

        if ((this.entities[entity].id & componentId) !== componentId) {
            this.entities[entity].id |= componentId;
        }
        
        if (component.type === ComponentType.Static || (this.entities[entity][componentId] !== null && this.entities[entity][componentId] !== undefined)) {
            return;
        }
        
        this.entities[entity][componentId] = this.newComponent(component.object);
    }
    
    removeComponent(entityId, componentId) {
        let component = this.components.get(componentId);
        
        if (!component) {
            return;
        }
        
        if ((this.entities[entityId].id & componentId) === componentId) {
            this.entities[entityId].id &= ~componentId;
        }
        
        if (component.type === ComponentType.Static ||
            component.type === ComponentType.SemiDynamic ||
            this.entities[entityId][componentId] === null ||
            this.entities[entityId][componentId] === undefined) {
            return;
        }
        
        this.entities[entityId][componentId] = null;
    }
    
    newEntity(components, returnDetails = false) {
        if (typeof components !== 'number' || components <= 0) {
            return returnDetails ? null : this.capacity;
        }
        
        let entity = this.getFirstUnusedEntity();
        
        if (entity >= this.capacity) {
            return returnDetails ? null : this.capacity;
        }
        
        if (entity > this.currentMaxEntity) {
            this.currentMaxEntity = entity;
        }
        
        for (let component of this.components.keys()) {
            if (component !== NoneComponent && (components & component) === component) {
                this.addComponent(entity, component);
            } else {
                this.removeComponent(entity, component);
            }
        }
        
        return returnDetails ? this.entities[entity] : entity;
    }
    
    removeEntity(entity) {
        for (let key of this.components.keys()) {
            if (key === NoneComponent) {
                continue;
            }
            
            this.removeComponent(entity, key);
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

class EntityManager {
    constructor(entityFactory = new EntityFactory(), systemManager = new SystemManager(), eventHandler = new EventHandler()) {
        this.entityFactory = entityFactory;
        this.systemManager = systemManager;
        this.eventHandler  = eventHandler;
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
    
    create(world, count = 1, configuration = undefined) {
        if (!(world instanceof World)) {
            return [];
        }
    
        configuration = configuration || this.configuration;

        let components = NoneComponent;
        
        for (let component of configuration.keys()) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entity = world.newEntity(components, true);
            
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

var Entities = { NoneComponent,
                 ComponentType,
                 World,
                 SelectorType,
                 SystemManager,
                 SystemType,
                 EventHandler,
                 EntityManager,
                 EntityFactory };

exports['default'] = Entities;