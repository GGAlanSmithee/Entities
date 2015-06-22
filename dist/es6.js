'use strict';

const NoneComponent = 0;

const ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

exports.NoneComponent = NoneComponent;
exports.ComponentType = ComponentType;

class World {
    constructor(capacity) {
        this.capacity = typeof capacity === 'number' ? capacity : 100;
    
        this.currentMaxEntity = -1;
        
        this.entities = Array.from({length: this.capacity}, v => v = { id : 0 });
        
        this.components = new Map();
        this.components.set(NoneComponent, { type : null, object : null });
    }

    getNextComponentId() {
        if (this.components === null || this.components === undefined) {
            this.components = new Map();
        }
        
        let max = Math.max(...this.components.keys());
        
        return max === undefined || max === null || max === -Infinity ? 0: max === 0 ? 1 : max * 2;
    }

    newComponent(object) {
        if (object === null || object === undefined) {
            return null;
        }

        switch (typeof object) {
            case 'function': return new object();
            case 'object'  : {
                return ((object) => {
                    var ret = {};
                    
                    Object.keys(object).forEach(key => ret[key] = object[key]);
                    
                    return ret;
                })(object);
            }
        }
        
        return object;
    }
    
    registerComponent(object, type = ComponentType.Static, returnDetails = true) {
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
    
    *getEntities(returnDetails = true) {
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            yield returnDetails ? this.entities[entity] : Math.floor(entity);
        }
    }
    
    *getEntitiesWith(components, returnDetails = true) {
        if (!components) {
            yield* this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) === components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
    
    *getEntitiesWithOnly(components, returnDetails = true) {
        if (!components) {
            yield* this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity].id !== NoneComponent && this.entities[entity].id === components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
    
    *getEntitiesWithout(components, returnDetails = true) {
        if (!components) {
            yield* this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity].id !== NoneComponent && (this.entities[entity].id & components) !== components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
}

exports.World = World;

