import { NoneComponent, ComponentType } from './Component.js';

export const SelectorType = {
    Get         : 0,
    GetWith     : 1,
    GetWithOnly : 2,
    GetWithout  : 3
};

export default class World {
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