/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

if (typeof exports === 'undefined') {
    global = window;
}

(function(){

    var root = this;



/* global Entites:true */
/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

/**
* @namespace Entities
*/
var Entities = Entities || {
	VERSION: '0.0.1'
};


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

    if (typeof exports !== 'undefined') {    
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Entities;
        }
        exports.Entities = Entities;
    } else if (typeof define !== 'undefined' && define.amd) {
        define('Entities', (function() { return root.Entities = Entities; }) ());
    } else {
        root.Entities = Entities;
    }
}).call(this);

/*
* "What matters in this life is not what we do but what we do for others, the legacy we leave and the imprint we make." - Eric Meyer
*/



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


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

'use strict';

Entities.EntityManager = function(world) {
    
};

Entities.EntityManager.prototype = {
    constructor : Entities.EntityManager
};


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

'use strict';

Entities.SystemManager = function() {

};

Entities.SystemManager.Type = {
    Init : 0,
    Logic : 1,
    Render : 2
};

Entities.SystemManager.prototype = {
    constructor : Entities.SystemManager,
    
    registerSystem : function(type, system) {
        switch (type) {
            case Entities.SystemManager.Type.Init:   this.InitSystems.push(system.name);   break;
            case Entities.SystemManager.Type.Logic:  this.LogicSystems.push(system.name);  break;
            case Entities.SystemManager.Type.Render: this.RenderSystems.push(system.name); break;
        }
        
        this[system.name] = system;
    }
};

Object.defineProperty(Entities.SystemManager.prototype, 'Type', {
    get: function() {
        return this._type;
    },
    set: function(type) {
        this._type = type;
    }
});

Object.defineProperty(Entities.SystemManager.prototype, 'InitSystems', {
    get: function() {
        return this._initSystems;
    },
    set: function(initSystems) {
        this._initSystems = initSystems;
    }
});

Object.defineProperty(Entities.SystemManager.prototype, 'LogicSystems', {
    get: function() {
        return this._logicSystems;
    },
    set: function(logicSystems) {
        this._logicSystems = logicSystems;
    }
});

Object.defineProperty(Entities.SystemManager.prototype, 'RenderSystems', {
    get: function() {
        return this._renderSystems;
    },
    set: function(renderSystems) {
        this._renderSystems = renderSystems;
    }
});


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