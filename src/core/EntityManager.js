/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityManager = function(world, systemManager, entityFactory) {
    this.World = world ? world : new Entities.World({ size : 100 });
    
    this.SystemManager = systemManager ? systemManager : new Entities.SystemManager();
    
    this.EntityFactory = entityFactory ? entityFactory : new Entities.EntityFactory(this.World);
};

Entities.EntityManager.prototype = {
    constructor : Entities.EntityManager,
    
    onInit : function() {
        Object.keys(this.SystemManager.InitSystems).forEach(function(key) {
            this[key];
        }, this.SystemManager.InitSystems);
    },
    
    onLogic : function(time) {
        Object.keys(this.SystemManager.LogicSystems).forEach(function(key) {
            this[key];
        }, this.SystemManager.LogicSystems);
    },
    
    onRender : function(renderer) {
        Object.keys(this.SystemManager.RenderSystems).forEach(function(key) {
            this[key];
        }, this.SystemManager.RenderSystems);
    },
    
    onCleanUp : function(renderer) {
        Object.keys(this.SystemManager.CleanUpSystems).forEach(function(key) {
            this[key];
        }, this.SystemManager.CleanUpSystems);
    }
};

Object.defineProperty(Entities.EntityManager.prototype, "World", {
    get: function() {
        return this._world;
    },
    set: function(world) {
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