/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityManager = function(world, entityFactory, systemManager, eventManager) {
    if (world && world instanceof Entities.World) {
        this.World = world;
    }
    
    if (entityFactory && entityFactory instanceof Entities.EntityFactory) {
        this.EntityFactory = entityFactory;
    }
    
    if (systemManager && systemManager instanceof Entities.SystemManager) {
        this.SystemManager = systemManager;
    }
    
    if (eventManager && eventManager instanceof Entities.EventManager) {
        this.EventManager = eventManager;
    }
    
    return this;
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
    
    listen : function(event, callback) {
        this.EventManager.listen(event, callback);
    },
    
    stopListening : function(event, callback) {
        this.EventManager.stopListening(event, callback);
    },
    
    trigger : function(event, args) {
        if (Array.isArray(args)) {
            args.unshift(this);
        } else {
            args = [ this, args ];
        }
        
        this.EventManager.trigger(event, args);
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
        return this._world ? this._world : (this._world = new Entities.World(1000));
    },
    set: function(world) {
        if (this.EntityFactory) {
            this.EntityFactory.World = world;
        }
        
        this._world = world;
    }
});

Object.defineProperty(Entities.EntityManager.prototype, "EntityFactory", {
    get: function() {
        return this._entityFactory ? this._entityFactory : (this._entityFactory = new Entities.EntityFactory(this.World));
    },
    set: function(entityFactory) {
        this._entityFactory = entityFactory;
    }
});

Object.defineProperty(Entities.EntityManager.prototype, "SystemManager", {
    get: function() {
        return this._systemManager ? this._systemManager : (this._systemManager = new Entities.SystemManager());
    },
    set: function(systemManager) {
        this._systemManager = systemManager;
    }
});

Object.defineProperty(Entities.EntityManager.prototype, "EventManager", {
    get: function() {
        return this._eventManager ? this._eventManager : (this._eventManager = new Entities.EventManager());
    },
    set: function(eventManager) {
        this._eventManager = eventManager;
    }
});