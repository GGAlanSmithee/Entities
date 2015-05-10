/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityFactory = function() {
    this.Initializers  = {};
    this.Configuration = {};
};

Entities.EntityFactory.prototype = {
    constructor : Entities.EntityFactory,
    
    build : function() {
        this.Configuration = {};
        
        return this;
    },
    
    withComponent : function(componentType, initializer) {
        // todo make a general reset function if no initializer function is passed in
        this.Configuration[componentType.name] = {
            type : componentType,
            initializer : initializer && typeof(initializer) === 'function' ?
                              initializer :
                              this.Initializers[componentType.name] ?
                                  this.Initializers[componentType.name] :
                                  function(component) {
                                      // reset here
                                  }
        };
        
        return this;
    },
    
    createConfiguration : function() {
        return this.Configuration;
    },
    
    create : function(world, count, configuration) {
        if (world === undefined || world === null || !(world instanceof Entities.World)) {
            throw 'An entity factory requires a world to work with';
        }
        
        let createdEntities = [];
        
        count = count ? count : 1;
        
        for (let i = 0; i < count; ++i)
        {
            let entity = world.getFirstUnusedEntity();
        
            if (entity >= world.Capacity) {
                break;
            }
            
            let entityComponentIdentifier = 0;
            
            if (!configuration) {
                configuration  = this.Configuration;
            }
            
            Object.keys(configuration).forEach(function(key) {
                let conf = configuration[key];
                
                if (world.Type !== Entities.World.Type.Static) {
                    world.createComponent(conf.type, entity);
                }
                
                entityComponentIdentifier = entityComponentIdentifier | world.ComponentType[key];
                
                conf.initializer(world[key][entity]);
            }, this);
            
            world.useEntity(entity, entityComponentIdentifier);
            
            createdEntities.push(entity);
        }
        
        return createdEntities;
    },
    
    registerInitializer : function(componentType, initializer) {
        if (!componentType) {
            return;
        }
        
        if (!initializer || !(typeof(initializer) === 'function')) {
            return;
        }
        
        this.Initializers[componentType.name] = initializer;
    }
};

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