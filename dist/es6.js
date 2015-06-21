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
        
        this.entities = Array.from({length: this.capacity}, v => v = 0);
        
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
            yield *this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity] !== NoneComponent && (this.entities[entity] & components) === components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
    
    *getEntitiesWithOnly(components, returnDetails = true) {
        if (!components) {
            yield *this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity] !== NoneComponent && this.entities[entity] === components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
    
    *getEntitiesWithout(components, returnDetails = true) {
        if (!components) {
            yield *this.getEntities(returnDetails);
        }
        
        for (let entity in this.entities) {
            if (entity > this.currentMaxEntity) {
                return;
            }
            
            if (this.entities[entity] !== NoneComponent && (this.entities[entity] & components) !== components) {
                yield returnDetails ? this.entities[entity] : Math.floor(entity);
            }
        }
    }
}

exports.World = World;

