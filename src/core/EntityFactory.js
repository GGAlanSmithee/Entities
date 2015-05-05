/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

'use strict';

Entities.EntityFactory = function(world) {
    if (world === undefined || world === null || !(world instanceof Entities.World)) {
        throw 'An entity factory requires a world to work with';
    }
    
    this.World            = world;
    this.Entity           = world.Capacity;
    this.EntityIdentifier = world.ComponentType.None;
};

Entities.EntityFactory.prototype = {
    constructor : Entities.EntityFactory,
    
    build : function() {
        this.Entity = this.World.getFirstUnusedEntity();
        
        if (this.Entity >= this.World.Capacity) {
            return this;
        }
        
        this.EntityIdentifier = this.World.ComponentType.None;
        
        return this;
    },
    
    withComponent : function(componentType, initializer) {
        if (this.Entity >= this.World.Capacity) {
            return this;
        }
        
        this.EntityIdentifier = this.EntityIdentifier | this.World.ComponentType[componentType.name];
        
        if (initializer && typeof(initializer) === 'function') {
            initializer(this.World[componentType.name][this.Entity]);
        } else {
            for (var member in this.World[componentType.name][this.Entity]) {
                delete this.World[componentType.name][this.Entity][member];
            }
        }
        
        return this;
    },
    
    create : function() {
        if (this.Entity >= this.World.Capacity) {
            return this.World.Capacity;
        }
        
        var entity = this.Entity;
        
        this.World.Entities[entity] = this.EntityIdentifier;
        
        this.Entity           = this.World.Capacity;
        this.EntityIdentifier = this.World.ComponentType.None;
        
        return entity;
    }
};

Object.defineProperty(Entities.EntityFactory.prototype, 'World', {
    get: function() {
        return this._world;
    },
    set: function(world) {
        this._world = world;
    }
});

Object.defineProperty(Entities.EntityFactory.prototype, 'Entity', {
    get: function() {
        return this._entity;
    },
    set: function(entity) {
        this._entity = entity;
    }
});

Object.defineProperty(Entities.EntityFactory.prototype, 'EntityIdentifier', {
    get: function() {
        return this._entityIdentifier;
    },
    set: function(entityIdentifier) {
        this._entityIdentifier = entityIdentifier;
    }
});