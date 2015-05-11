/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityManager = function(world, entityFactory, systemManager) {
    this.World = world ? world : new Entities.World(1000);
    
    this.EntityFactory = entityFactory ? entityFactory : new Entities.EntityFactory(this.World);
    
    this.SystemManager = systemManager ? systemManager : new Entities.SystemManager();
    
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