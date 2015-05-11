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
    
    return this;
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