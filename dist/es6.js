'use strict';

const NoneComponent = 0;

const ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

exports.NoneComponent = NoneComponent;
exports.ComponentType = ComponentType;

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
    
    getNextComponentId() {
        if (this.components === null || this.components === undefined) {
            this.components = new Map();
        }
        
        let max = Math.max(...this.components.keys());
        
        return max === undefined || max === null || max === -Infinity ? 0 : max === 0 ? 1 : max * 2;
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
    
    registerComponentType(object, type = ComponentType.Static, returnDetails = false) {
        if (object === null || object === undefined) {
            throw TypeError('object cannot be null.');
        }
        
        let id = this.getNextComponentId(this.components);
        
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

exports.World = World;
exports.SelectorType = SelectorType;

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
        
        this.maxRegisteredSystemId = -1;
    }
    
    getNextSystemId() {
        if (!Number.isInteger(this.maxRegisteredSystemId)) {
            this.maxRegisteredSystemId = -1;
        }
        
        let max = this.maxRegisteredSystemId;
        
        this.systems.forEach(system => {
            max = Math.max(max, ...system.keys());
        });
        
        if (max > this.maxRegisteredSystemId) {
            this.maxRegisteredSystemId = max;
        }
        
        return this.maxRegisteredSystemId + 1;
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
    
    	let systemId = this.getNextSystemId();
    	
    	this.systems.get(type).set(systemId, system);

    	return (this.maxRegisteredSystemId = systemId);
    }
    
    removeSystem(system) {
        if (!Number.isInteger(system)) {
            return false;
        }

        for (let [,typeSystem] of this.systems) {
            for (let [id] of typeSystem) {
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
        
        for (let [,typeSystem] of this.systems) {
            for (let [id] of typeSystem) {
                if (id === system) {
                    return typeSystem.get(system);
                }
            }
        }
    }
}

exports.SystemManager = SystemManager;
exports.SystemType = SystemType;

class EntityFactory {
    constructor() {
        this.initializers  = {};
        this.configuration = new Map();
    }
    
    registerInitializer(component, initializer) {
        if (!Number.isInteger(component) || typeof initializer !== 'function') {
            return;
        }
        
        this.initializers[component] = initializer;
    }
    
    build() {
        this.configuration = new Map();
        
        return this;
    }
    
    withComponent(component, initializer) {
        if (!Number.isInteger(component)) {
            return;
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers[component] ?
                this.initializers[component] :
                initializer = component => {
                    // todo make a generic reset function if no initializer function is passed in
                    // todo need to work for all types -> strings, numbers, objects, functions, classes etc.
                    // todo needs to be documented
                };
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
        
        for (let component of configuration) {
            components |= component;
        }
        
        let entities = [];
        
        for (let i = 0; i < count; ++i) {
            let entity = world.newEntity(components, true);
            
            for (let component of Object.keys(entity)) {
                if (!Number.isInteger(component) || (entity.id & component) !== component) {
                    continue;
                }
                
                // todo there might be a need to capture returned scalars and primites.. check old factory 
                // todo or maybe entity should be this if not possible??
                configuration[component].initializer.call(entity[component]);
            }
            
            entities.push(entity);
        }
        
        return entities;
    }
}

exports.EntityFactory = EntityFactory;

