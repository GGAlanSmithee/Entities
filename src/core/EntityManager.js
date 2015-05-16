/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityManager = function(world, entityFactory, systemManager, eventHandler) {
    this.world = world && world instanceof Entities.World ? world : new Entities.World();
    
    this.factory = entityFactory && entityFactory instanceof Entities.EntityFactory ? entityFactory : new Entities.EntityFactory();
    
    this.systemManager = systemManager && systemManager instanceof Entities.SystemManager ? systemManager : new Entities.SystemManager();
        
    this.eventHandler = eventHandler && eventHandler instanceof Entities.EventHandler ? eventHandler : new Entities.EventHandler();
    
    return this;
};

Entities.EntityManager.getEntityIndex = function(world, entity) {
    return entity = typeof entity === 'number' ? entity : typeof entity === 'object' && entity.index ? entity.index : world.capacity;
};

Entities.EntityManager.prototype = {
    constructor : Entities.EntityManager,
    
    registerComponent : function(type, component, initializer) {
        let componentId = this.world.registerComponent(type, component);
        
        if (typeof(initializer) !== 'function') {
            return componentId;
        }
        
        this.factory.registerInitializer(componentId, initializer);
        
        return componentId;
    },
    
    registerSystem : function(type, mask, system) {
        this.systemManager.registerSystem(type, mask, system);
    },
    
    build : function() {
        this.factory.build();
        
        return this;
    },
    
    withComponent : function(component, initializer) {
        this.factory.withComponent(component, initializer);
        
        return this;
    },
    
    createConfiguration : function() {
        return this.factory.createConfiguration();
    },
    
    create : function(count, configuration) {
        return this.factory.create(this.world, count, configuration);
    },
    
    removeEntity : function(entity) {
        this.world.removeEntity(Entities.EntityManager.getEntityIndex(this.world, entity));
    },
    
    getEntities : function(components) {
        return this.world.getEntities(components, true);
    },
    
    removeComponent : function(entity, component) {
        this.world.removeComponent(Entities.EntityManager.getEntityIndex(this.world, entity), component);
    },
    
    listen : function(event, handler, callback) {
        this.eventHandler.listen(event, handler, callback);
    },
    
    stopListening : function(event, handler) {
        this.eventHandler.stopListening(event, handler);
    },
    
    trigger : function() {
        return this.eventHandler.trigger.apply(this, arguments);
    },
    
    onInit : function() {
        let i = this.systemManager.initSystems.length - 1;
        while (i >= 0) {
            let system = this.systemManager.initSystems[i];
            
            system.callback.call(this, this.world.getEntities(system.mask, true));
            
            --i;
        }
    },
    
    onLogic : function(time) {
        let i = this.systemManager.logicSystems.length - 1;
        while (i >= 0) {
            let system = this.systemManager.logicSystems[i];
            
            system.callback.call(this, this.world.getEntities(system.mask, true));
            
            --i;
        }
    },
    
    onRender : function(renderer) {
        let i = this.systemManager.renderSystems.length - 1;
        while (i >= 0) {
            let system = this.systemManager.renderSystems[i];
            
            system.callback.call(this, this.world.getEntities(system.mask, true));
            
            --i;
        }
    },
    
    onCleanUp : function(renderer) {
        let i = this.systemManager.cleanUpSystems.length - 1;
        while (i >= 0) {
            let system = this.systemManager.cleanUpSystems[i];
            
            system.callback.call(this, this.world.getEntities(system.mask, true));
            
            --i;
        }
    }
};