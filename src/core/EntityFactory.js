/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EntityFactory = function() {
    this.initializers  = {};
    this.configuration = {};
    
    return this;
};

Entities.EntityFactory.prototype = {
    constructor : Entities.EntityFactory,
    
    registerInitializer : function(component, initializer) {
        if (!component) {
            return;
        }
        
        if (!initializer || typeof(initializer) !== 'function') {
            return;
        }
        
        this.initializers[component] = initializer;
    },
    
    build : function() {
        this.configuration = {};
        
        return this;
    },
    
    withComponent : function(component, initializer) {
        if (initializer === null || initializer === undefined) {
            initializer = this.initializers[component];
        }
        
        if (initializer === null || initializer === undefined) {
            initializer = function(component) {
                // todo make a generic reset function if no initializer function is passed in
            };
        }
        
        this.configuration[component] = {
            component : component,
            initializer : initializer
        };
        
        return this;
    },
    
    createConfiguration : function() {
        return this.configuration;
    },
    
    create : function(world, count, configuration) {
        if (world === undefined || world === null || !(world instanceof Entities.World)) {
            //todo add logging here
            
            return [];
        }
    
        count         = count ? count : 1;
        configuration = configuration ? configuration : this.configuration;

        let components = Entities.World.None;
        let keys       = Object.keys(configuration);
        
        let i = keys.length - 1;
        while (i >= 0) {
            components |= configuration[keys[i]].component;
            
            --i;
        }
        
        let entities = [];
        
        i = count - 1;
        while(i >= 0) {
            let entity = world.addEntity(components, true);
            
            let entityComponents = Object.keys(entity);
            
            let j = entityComponents.length - 1;
            while (j >= 0) {
                let component = Number(entityComponents[j]);
                
                if (Number.isInteger(component) && (entity.id & component) === component) {
                    let result = configuration[component].initializer.call(entity[component]);
                    
                    if (typeof entity[component] !== 'function' && typeof entity[component] !== 'object' && result !== undefined) {
                        entity[component] = result;
                    }
                }
                
                --j;
            }
            
            entities.push(entity);
            
            --i;
        }
        
        return entities;
    }
};