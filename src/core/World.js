/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.World = function(capacity) {
    
    this.capacity = typeof capacity === 'number' ? capacity : 100;
    
    this.currentMaxEntity = 0;
    
    this.entities = [];
    
    let i = 0;
    while (i < this.capacity) {
        this.entities[i] = { index : i, id : 0 };
        
        ++i;
    }
    
    this.components = { };
    
    this.components[Entities.World.None] = {
        type   : null,
        object : null
    };
    
    return this;
};

Entities.World.None = 0;

Entities.World.ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

Entities.World.getNextComponentTypeId = function(components) {
    if (components === undefined || components === null || typeof components !== 'object') {
        return 0;
    }
    
    let arr  = [];
    let keys = Object.keys(components);
    
    let i = 0, length = keys.length;
    while (i < length) {
        arr.push(Math.floor(keys[i]));
        
        ++i;
    }
    
    let max = Math.max.apply(null, arr);
    
    return max === undefined || max === null || max === -Infinity ? 0: max === 0 ? 1 : max * 2;
};

Entities.World.newComponent = function(object) {
    if (object === null || object === undefined) {
        return null;
    }
    
    let type = typeof object;
    
    if (type === 'function') {
        return new object();
    }
    
    if (type === 'object') {
        return (function (object) {
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

Entities.World.getEntities = function(world, returnDetails) {
    if (!(world instanceof Entities.World)) {
        return [];
    }
    
    if (returnDetails) {
        return world.entities;
    }
        
    let ret = [];

    let i = 0;    
    while (i <= world.currentMaxEntity) {
        if (world.entities[i].id !== Entities.World.None) {
            ret.push(i);
        }
        
        ++i;
    }
    
    return ret;
};

Entities.World.prototype = {
    constructor : Entities.World,
    
    registerComponent : function(type, object, returnDetails) {
        let id = Entities.World.getNextComponentTypeId(this.components);
        
        if (type === undefined || type === null || object === undefined || object === null) {
            throw new Error('registerComponent expects a type and object.');
        }
        
        if (type !== Entities.World.ComponentType.Dynamic && type !== Entities.World.ComponentType.SemiDynamic) {
            type = Entities.World.ComponentType.Static;
        }
        
        let component = {
            type   : type,
            object : object
        };
        
        this.components[id] = component;
        
        if (type === Entities.World.ComponentType.Static) {
            let entity = 0;
            
            while (entity < this.capacity) {
                this.entities[entity][id] = Entities.World.newComponent(object);
                
                ++entity;
            }
        }
        
        return returnDetails ? this.components[id] : id;
    },
    
    addComponent : function(entity, componentId) {
        let component = this.components[componentId];
        
        if (!component) {
            return;
        }

        if ((this.entities[entity].id & componentId) === componentId) {
            return;
        }
        
        this.entities[entity].id |= componentId;
        
        if (component.type === Entities.World.ComponentType.Static) {
            return;
        }
        
        if (this.entities[entity][componentId] !== null && this.entities[entity][componentId] !== undefined) {
            return;
        }
        
        this.entities[entity][componentId] = Entities.World.newComponent(component.object);
    },
    
    removeComponent : function(entity, componentId) {
        let component = this.components[componentId];
        
        if (!component) {
            return;
        }
        
        if ((this.entities[entity].id & componentId) !== componentId) {
            return;
        }
        
        this.entities[entity].id &= ~componentId;
        
        if (component.type === Entities.World.ComponentType.Static ||
            component.type === Entities.World.ComponentType.SemiDynamic ||
            this.entities[entity][componentId] === null ||
            this.entities[entity][componentId] === undefined) {
            return;
        }
        
        this.entities[entity][componentId] = null;
    },
    
    getFirstUnusedEntity : function() {
        let entity = 0;
        
        while (entity < this.capacity) {
            if (this.entities[entity] && this.entities[entity].id === Entities.World.None) {
                return entity;
            }
            
            ++entity;
        }
        
        return this.capacity;
    },
    
    increaseCapacity : function() {
        let i = (this.capacity *= 2) / 2;
        while (i < this.capacity) {
            this.entities[i] = { index : i, id : 0 };
            
            ++i;
        }
    },
    
    addEntity : function(components, returnDetails) {
        if (typeof components !== 'number' || components <= 0) {
            return null;
        }
        
        let entity = this.getFirstUnusedEntity();
        
        if (entity === this.capacity) {
            this.increaseCapacity();
        }
        
        if (entity > this.currentMaxEntity) {
            this.currentMaxEntity = entity;
        }
        
        let componentId = Entities.World.None;
        let keys        = Object.keys(this.components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            componentId = Math.floor(keys[i]);
            
            if ((components & componentId) === componentId) {
                this.addComponent(entity, componentId);
            } else {
                this.removeComponent(entity, componentId);
            }
            
            ++i;
        }
        
        return returnDetails ? this.entities[entity] : entity;
    },
    
    removeEntity : function(entity) {
        if (entity > this.currentMaxEntity) {
            return;
        }
        
        let keys = Object.keys(this.components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            this.removeComponent(entity, Math.floor(keys[i]));
            
            ++i;
        }
        
        if (entity <= this.currentMaxEntity) {
            return;
        }
        
        i = entity;
        
        while (i >= 0) {
            if (this.entities[i].id !== Entities.World.None) {
                this.currentMaxEntity = i;
            }
            
            --i;
        }
    },
    
    getEntities : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
        
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && (this.entities[i].id & components) === components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    },
    
    getEntitiesExact : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
    
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && this.entities[i].id === components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    },
    
    getEntitiesExcept : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
    
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && (this.entities[i].id & components) !== components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    }
};