/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.World = function(capacity, type) {
    this.ComponentType = {
        None : 0
    };
    
    this.Capacity = capacity ? capacity : 100;
    
    this.CurrentMaxEntity = 0;
    
    this.Type = type !== undefined ? type : Entities.World.Type.Static;
    
    this.Entities = [];
    
    for (let i = 0; i < this.Capacity; ++i) {
        this.Entities.push(this.ComponentType.None);
    }
};

Entities.World.Type = {
    Dynamic : 0,
    SemiDynamic : 1,
    Static : 2
};

Entities.World.prototype = {
    constructor : Entities.World,
    
    registerComponent : function(component) {
        let arr = [];
            
        Object.keys(this.ComponentType).forEach(function(key) {
            arr.push(this[key]);
        }, this.ComponentType);
        
        let max = Math.max.apply(null, arr);
        
        this.ComponentType[component.name] = max === undefined || max === null ? 0: max === 0 ? 1 : max * 2;
        
        if (this[component.name]) {
            return;
        }
        
        this[component.name] = [];
        
        if (this.Type !== Entities.World.Type.Static) {
            return;
        }
        
        for (let i = 0; i < this.Capacity; ++i) {
            this[component.name].push(new global[component.name]());
        }
    },
    
    createComponent : function(componentType, entity) {
      if (this[componentType.name][entity] === null || this[componentType.name][entity] === undefined || !(this[componentType.name] instanceof componentType)) {
          this[componentType.name][entity] = new global[componentType.name]();
      }
    },
    
    destroyComponent : function(componentType, entity) {
      if (this[componentType.name][entity] !== null && this[componentType.name][entity] !== undefined) {
          this[componentType.name][entity] = null;
      }
    },
    
    getFirstUnusedEntity : function() {
        for (let entity = 0; entity < this.Capacity; ++entity) {
            if (this.Entities[entity] === this.ComponentType.None) {
                return entity;
            }
        }
        
        return this.capacity;
    },
    
    useEntity : function(entity, identifier) {
        if (entity > this.CurrentMaxEntity) {
            this.CurrentMaxEntity = entity;
        }
        
        this.Entities[entity] = identifier;
    },
    
    unuseEntity : function(entity) {
        if (entity >= this.capacity) {
            return;
        }
        
        if (this.Type === Entities.World.Type.Dynamic) {
            for (let component in this.ComponentType) {
                if (this.ComponentType.hasOwnProperty(component) &&
                    this.ComponentType[component] !== this.ComponentType.None &&
                    (entity & this.ComponentType[component]) === this.ComponentType[component]) {
                    this[component].splice(entity, 1);
                }
            }
        }
        
        this.Entities[entity] = this.ComponentType.None;
        
        if (entity <= this.CurrentMaxEntity) {
            return;
        }
        
        let i = entity;
        
        while (i >= 0) {
            if (this.Entities[i] !== this.ComponentType.None) {
                this.CurrentMaxEntity = i;
                
                return;
            }
            
            --i;
        }
    },
    
    getEntities : function(components) {
        if (components === undefined || components === null) {
            return this.Entities;
        }
        
        let entities = [];
        
        let mask = 0;
        
        components = components.constructor === Array ? components : [ components ];
        
        components.forEach(function(component) {
            mask = mask | component;
        });

        for (let entity = 0; entity <= this.CurrentMaxEntity; ++entity) {
            if ((this.Entities[entity] & mask) === mask) {
                entities.push(entity);
            }
        }
        
        return entities;
    },
    
    getComponents : function(entity) {
        if (entity === undefined || entity === null) {
            return [];
        }
        
        let components = [];
        
        Object.keys(this.ComponentType).forEach(function(key) {
            let component = this.ComponentType[key];
            
            if (component !== this.ComponentType.None && (this.Entities[entity] & component) === component) {
                components.push(this[key][entity]);
            }
        }, this);
        
        return components;
    }
};

Object.defineProperty(Entities.World.prototype, 'Entities', {
    get: function() {
        return this._entities;
    },
    set: function(entities) {
        this._entities = entities;
    }
});

Object.defineProperty(Entities.World.prototype, 'Capacity', {
    get: function() {
        return this._capacity;
    },
    set: function(capacity) {
        this._capacity = capacity;
    }
});

Object.defineProperty(Entities.World.prototype, 'CurrentMaxEntity', {
    get: function() {
        return this._currentMaxEntity;
    },
    set: function(currentMaxEntity) {
        this._currentMaxEntity = currentMaxEntity;
    }
});

Object.defineProperty(Entities.World.prototype, 'Type', {
    get: function() {
        return this._type;
    },
    set: function(type) {
        this._type = type;
    }
});

Object.defineProperty(Entities.World.prototype, 'ComponentType', {
    get: function() {
        return this._componentType;
    },
    set: function(componentType) {
        this._componentType = componentType;
    }
});