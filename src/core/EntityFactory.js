/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityFactory = function(world) {
    if (world === undefined || world === null || !(world instanceof Entities.World)) {
        throw 'An entity factory requires a world to work with';
    }
    
    this.World                   = world;
    this.ComponentsConfiguration = {};
};

Entities.EntityFactory.prototype = {
    constructor : Entities.EntityFactory,
    
    build : function() {
        this.Components = {};
        
        return this;
    },
    
    withComponent : function(componentType, initializer) {
        // todo make a general reset function if no initializer function is passed in
        this.ComponentsConfiguration[componentType.name] = {
            type : componentType,
            initializer : initializer && typeof(initializer) === 'function' ? initializer : function(component) {
                // reset here
            }
        };
        
        return this;
    },
    
    create : function(count) {
        let createdEntities = [];
        
        count = count ? count : 1;
        
        for (let i = 0; i < count; ++i)
        {
            let entity = this.World.getFirstUnusedEntity();
        
            if (entity >= this.World.Capacity) {
                break;
            }
            
            let entityComponentIdentifier = 0;
            
            Object.keys(this.ComponentsConfiguration).forEach(function(key) {
                let configuration = this.ComponentsConfiguration[key];
                
                if (this.World.Type !== Entities.World.Type.Static) {
                    this.World.createComponent(configuration.type, entity);
                }
                
                entityComponentIdentifier = entityComponentIdentifier | this.World.ComponentType[key];
                
                configuration.initializer(this.World[key][entity]);
            }, this);
            
            this.World.useEntity(entity, entityComponentIdentifier);
            
            createdEntities.push(entity);
        }
        
        return createdEntities;
    },
    
    createConfiguration : function() {
        
        let configuration = {
            // add components, initializers etc
        };
        
        return configuration;
    },
    
    createFromConfiguration : function(configuration, count) {
        
        //todo use configuration
        
        let createdEntities = [];
        
        count = count ? count : 1;
        
        for (let i = 0; i < count; ++i)
        {
            let entity = this.World.getFirstUnusedEntity();
        
            if (entity >= this.World.Capacity) {
                break;
            }
            
            let entityComponentIdentifier = 0;
            
            Object.keys(this.ComponentsConfiguration).forEach(function(key) {
                let configuration = this.ComponentsConfiguration[key];
                
                if (this.World.Type !== Entities.World.Type.Static) {
                    this.World.createComponent(configuration.type, entity);
                }
                
                entityComponentIdentifier = entityComponentIdentifier | this.World.ComponentType[key];
                
                configuration.initializer(this.World[key][entity]);
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

Object.defineProperty(Entities.EntityFactory.prototype, 'ComponentsConfiguration', {
    get: function() {
        return this._componentsConfiguration;
    },
    set: function(componentsConfiguration) {
        this._componentsConfiguration = componentsConfiguration;
    }
});