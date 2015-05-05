/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

'use strict';

Entities.World = function(capacity, type) {
    this.ComponentType = {
        None : 0
    };
    
    this.Capacity = capacity ? capacity : 100;
    
    this.CurrentMaxEntity = 0;
    
    this.Type = type !== undefined ? type : Entities.World.Type.Static;
    
    this.Entities = [];
    
    for (var i = 0; i < this.Capacity; ++i) {
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
        var arr = [];
            
        for (var type in this.ComponentType) {
           if (this.ComponentType.hasOwnProperty(type)) {
                arr.push(this.ComponentType[type]);
            }
        }
        
        var max = Math.max.apply(null, arr);
        
        this.ComponentType[component.name] = max === undefined || max === null ? 0: max === 0 ? 1 : max * 2;
        
        if (this[component.name]) {
            return;
        }
        
        this[component.name] = [];
        
        if (this.Type !== Entities.World.Type.Static) {
            return;
        }
        
        for (var i = 0; i < this.Capacity; ++i) {
            this[component.name].push(new global[component.name]());
        }
    },
    
    getFirstUnusedEntity : function() {
        var entity = 0;
        
        while (entity < this.Capacity) {
            if (this.Entities[entity] === this.ComponentType.None) {
                if (entity > this.CurrentMaxEntity) {
                    this.CurrentMaxEntity = entity;
                }
                
                return entity;
            }
            
            ++entity;
        }
        
        return this.capacity;
    },
    
    markEntityAsUnused : function(entity) {
        if (entity >= this.capacity) {
            return;
        }
        
        this.Entities[entity] = this.ComponentType.None;
        
        if (entity < this._maxEntity) {
            return;
        }
        
        var i = entity;
        
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
            return Entities;
        }
        
        var entities = [];
        
        var mask = 0;
        
        components = components.constructor === Array ? components : [ components ];
        
        components.forEach(function(component) {
            mask = mask | component;
        });

        var entity = 0;
        
        while (entity <= this.CurrentMaxEntity) {
            if ((this.Entities[entity] & mask) === mask) {
                entities.push(entity);
            }
            
            ++entity;
        }
        
        return entities;
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