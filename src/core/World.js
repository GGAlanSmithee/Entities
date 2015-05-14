/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.World = function(capacity) {
    
    this.Capacity = capacity ? capacity : 100;
    
    this.CurrentMaxEntity = 0;
    
    this.Entities = [];
    
    let i = 0;
    while (i < this.Capacity) {
        this.Entities[i] = { id : 0 };
        
        ++i;
    }
    
    this.Components = {
        0 : {
            id     : Entities.World.None,
            type   : null,
            object : null
        }
    };
    
    return this;
};

Entities.World.None = 0;

Entities.World.ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

Entities.World.getNextComponentId = function(components) {
    let arr  = [];
    let keys = Object.keys(components);
    
    let i = 0, length = keys.length;
    while (i < length) {
        arr.push(components[keys[i]].id);
        
        ++i;
    }
    
    let max = Math.max.apply(null, arr);
    
    return max === undefined || max === null ? 0: max === 0 ? 1 : max * 2;
};

Entities.World.newComponentFromObject = function(object) {
    let type = typeof object;
    
    if (type === 'function') {
        return new global[object.name]();
    }
    
    if (type === 'object') {
        return new (function (object) {
            var ret  = {};
            var keys = Object.keys(object);
            
            var i = 0, length = keys.length;
            while (i < length) {
                ret[keys[i]] = object[keys[i]];
                ++i;
            }
            
            return ret;
        })(object);
    }
    
    return object;
};
    
Entities.World.prototype = {
    constructor : Entities.World,
    
    registerComponent : function(type, object, returnDetails) {
        let id = Entities.World.getNextComponentId(this.Components);
        
        let component = {
            id     : id,
            type   : type,
            object : object
        };
        
        this.Components[id] = component;
        
        if (type === Entities.World.ComponentType.Static) {
            let entity = 0;
            
            while (entity < this.Capacity) {
                this.Entities[entity][id] = Entities.World.newComponentFromObject(object);
                
                ++entity;
            }
        }
        
        return returnDetails ? this.Components[id] : id;
    },
    
    addComponent : function(entity, component, returnDetails) {
        if (!this.Components[component]) {
            throw 'cannot add component: there is no registered component template ' + component;
        }

        if ((this.Entities[entity].id & this.Components[component].id) === this.Components[component].id) {
            return;
        }
        
        this.Entities[entity].id |= this.Components[component].id;
        
        if (this.Components[component].type === Entities.World.ComponentType.Static) {
            return;
        }
        
        if (this.Entities[entity][component] !== null && this.Entities[entity][component] !== undefined) {
            return;
        }
        
        this.Entities[entity][component] = Entities.World.newComponentFromObject(this.Components[component].object);
        
        return returnDetails ? this.Entities[entity][component] : component;
    },
    
    removeComponent : function(entity, component) {
        if (!this.Components[component]) {
            throw 'cannot remove component: there is no registered component template ' + component;
        }
        
        if ((this.Entities[entity].id & this.Components[component].id) !== this.Components[component].id) {
            return;
        }
        
        this.Entities[entity].id &= ~this.Components[component].id;
        
        if (this.Components[component].type === Entities.World.ComponentType.Static ||
            this.Components[component].type === Entities.World.ComponentType.SemiDynamic) {
            return;
        }
        
        if (this.Entities[entity][component] === null || this.Entities[entity][component] === undefined) {
            return;
        }
        
        this.Entities[entity][component] = null;
    },
    
    getFirstUnusedEntity : function() {
        let entity = 0;
        
        while (entity < this.Capacity) {
            if (this.Entities[entity] && this.Entities[entity].id === Entities.World.None) {
                return entity;
            }
            
            ++entity;
        }
        
        return this.Capacity;
    },
    
    addEntity : function(components, returnDetails) {
        let entity = this.getFirstUnusedEntity();
        
        if (entity === this.Capacity) {
            
            let i = this.Capacity, length = (this.Capacity *= 2);
            while (i < length) {
                this.Entities[i] = { id : 0 };
                
                ++i;
            }
        }
        
        if (entity > this.CurrentMaxEntity) {
            this.CurrentMaxEntity = entity;
        }
        
        let componentId = Entities.World.None;
        let keys        = Object.keys(this.Components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            componentId = this.Components[keys[i]].id;
            
            if ((components & componentId) === componentId) {
                this.addComponent(entity, componentId);
            } else {
                this.removeComponent(entity, componentId);
            }
            
            ++i;
        }
        
        return returnDetails ? this.Entities[entity] : entity;
    },
    
    removeEntity : function(entity) {
        if (entity > this.CurrentMaxEntity) {
            return;
        }
        
        let keys = Object.keys(this.Components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            this.removeComponent(entity, keys[i]);
            
            ++i;
        }
        
        if (entity <= this.CurrentMaxEntity) {
            return;
        }
        
        i = entity;
        
        while (i >= 0) {
            if (this.Entities[i].id !== Entities.World.None) {
                this.CurrentMaxEntity = i;
            }
            
            --i;
        }
    },
    
    getEntities : function(components, returnDetails) {
        let entities = [];

        let i = 0;    
        
        if (components === undefined || components === null) {
            while (i <= this.CurrentMaxEntity) {
                if (this.Entities[i].id !== Entities.World.None) {
                    entities.push(returnDetails ? this.Entities[i] : i);
                }
                
                ++i;
            }
            
            return entities;
        }
    
        i = 0;
        while (i <= this.CurrentMaxEntity) {
            if (this.Entities[i].id !== Entities.World.None && (this.Entities[i].id & components) === components) {
                entities.push(returnDetails ? this.Entities[i] : i);
            }
            
            ++i;
        }
        
        return entities;
    }
};

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

Object.defineProperty(Entities.World.prototype, 'Entities', {
    get: function() {
        return this._entities;
    },
    set: function(entities) {
        this._entities = entities;
    }
});

Object.defineProperty(Entities.World.prototype, 'Components', {
    get: function() {
        return this._components;
    },
    set: function(components) {
        this._components = components;
    }
});