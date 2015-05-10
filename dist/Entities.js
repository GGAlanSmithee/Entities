'use strict';

/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

if (typeof exports === 'undefined') {
    var global = window;
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

Entities.EntityFactory = function(world) {
    if (world === undefined || world === null || !(world instanceof Entities.World)) {
        throw 'An entity factory requires a world to work with';
    }
        
    this.World         = world;
    this.Initializers  = {};
    this.Configuration = {};
};

Entities.EntityFactory.prototype = {
    constructor : Entities.EntityFactory,
    
    registerInitializer : function(componentType, initializer) {
        if (!componentType) {
            return;
        }
        
        if (!initializer || !(typeof(initializer) === 'function')) {
            return;
        }
        
        this.Initializers[componentType.name] = initializer;
    },
    
    build : function() {
        this.Configuration = {};
        
        return this;
    },
    
    withComponent : function(componentType, initializer) {
        this.Configuration[componentType.name] = {
            type : componentType,
            initializer : initializer && typeof(initializer) === 'function' ?
                              initializer :
                              this.Initializers[componentType.name] ?
                                  this.Initializers[componentType.name] :
                                  function(component) {
                                      // todo make a generic reset function if no initializer function is passed in
                                  }
        };
        
        return this;
    },
    
    createConfiguration : function() {
        return this.Configuration;
    },
    
    create : function(count, configuration) {
        let createdEntities = [];
        
        count = count ? count : 1;
        
        for (let i = 0; i < count; ++i)
        {
            let entity = this.World.getFirstUnusedEntity();
        
            if (entity >= this.World.Capacity) {
                break;
            }
            
            let entityComponentIdentifier = 0;
            
            if (!configuration) {
                configuration  = this.Configuration;
            }
            
            Object.keys(configuration).forEach(function(key) {
                let conf = configuration[key];
                
                if (this.World.Type !== Entities.World.Type.Static) {
                    this.World.createComponent(conf.type, entity);
                }
                
                entityComponentIdentifier = entityComponentIdentifier | this.World.ComponentType[key];
                
                conf.initializer(this.World[key][entity]);
            }, this);
            
            this.World.useEntity(entity, entityComponentIdentifier);
            
            createdEntities.push(entity);
        }
        
        return createdEntities;
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
Object.defineProperty(Entities.EntityFactory.prototype, 'Configuration', {
    get: function() {
        return this._configuration;
    },
    set: function(configuration) {
        this._configuration = configuration;
    }
});

Object.defineProperty(Entities.EntityFactory.prototype, 'Initializers', {
    get: function() {
        return this._initializers;
    },
    set: function(initializers) {
        this._initializers = initializers;
    }
});


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityManager = function(world, entityFactory, systemManager) {
    this.World = world ? world : new Entities.World(1000);
    
    this.EntityFactory = entityFactory ? entityFactory : new Entities.EntityFactory(this.World);
    
    this.SystemManager = systemManager ? systemManager : new Entities.SystemManager();
};

Entities.EntityManager.prototype = {
    constructor : Entities.EntityManager,
    
    registerComponent : function(component, initializer) {
        this.World.registerComponent(component);
        
        if (!initializer || typeof(initializer) !== 'function') {
            return;
        }
        
        this.registerInitializer(component, initializer);
    },
    
    registerInitializer : function(component, initializer) {
        this.EntityFactory.registerInitializer(component, initializer);
    },
    
    registerSystem : function(system, type) {
        this.SystemManager.registerSystem(system, type);
    },
    
    build : function() {
        return this.EntityFactory.build();
    },
    
    createFromConfiguration : function(configuration, count) {
        return this.EntityFactory.create(count, configuration);
    },
    
    destroy : function(entity) {
        this.World.unuseEntity(entity);
    },
        
    onInit : function() {
        this.SystemManager.InitSystems.forEach(function(system) {
            system(this.World);
        }, this);
    },
    
    onLogic : function(time) {
        this.SystemManager.LogicSystems.forEach(function(system) {
            system(this.World);
        }, this);
    },
    
    onRender : function(renderer) {
        this.SystemManager.RenderSystems.forEach(function(system) {
            system(this.World);
        }, this);
    },
    
    onCleanUp : function(renderer) {
        this.SystemManager.CleanUpSystems.forEach(function(system) {
            system(this.World);
        }, this);
    }
};

Object.defineProperty(Entities.EntityManager.prototype, "World", {
    get: function() {
        return this._world;
    },
    set: function(world) {
        if (this.EntityFactory) {
            this.EntityFactory.World = world;
        }
        
        this._world = world;
    }
});

Object.defineProperty(Entities.EntityManager.prototype, "SystemManager", {
    get: function() {
        return this._systemManager;
    },
    set: function(systemManager) {
        this._systemManager = systemManager;
    }
});

Object.defineProperty(Entities.EntityManager.prototype, "EntityFactory", {
    get: function() {
        return this._entityFactory;
    },
    set: function(entityFactory) {
        this._entityFactory = entityFactory;
    }
});


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.SystemManager = function() {
    this.InitSystems    = [];
    this.LogicSystems   = [];
    this.RenderSystems  = [];
    this.CleanUpSystems = [];
};

Entities.SystemManager.Type = {
    Init : 0,
    Logic : 1,
    Render : 2,
    CleanUp : 3
};

Entities.SystemManager.prototype = {
    constructor : Entities.SystemManager,
    
    registerSystem : function(system, type) {
        if (type === undefined || type === null) {
            type = Entities.SystemManager.Type.Logic;
        }
        
        switch (type) {
            case Entities.SystemManager.Type.Init:    this.InitSystems.push(system);    break;
            case Entities.SystemManager.Type.Logic:   this.LogicSystems.push(system);   break;
            case Entities.SystemManager.Type.Render:  this.RenderSystems.push(system);  break;
            case Entities.SystemManager.Type.CleanUp: this.CleanUpSystems.push(system); break;
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

Object.defineProperty(Entities.SystemManager.prototype, 'CleanUpSystems', {
    get: function() {
        return this._cleanUpSystems;
    },
    set: function(cleanUpSystems) {
        this._cleanUpSystems = cleanUpSystems;
    }
});


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