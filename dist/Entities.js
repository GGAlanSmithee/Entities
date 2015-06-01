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



if (!Number.isInteger) {
    Number.isInteger = function isInteger (nVal) {
        return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
    };
}


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
    return Number.isInteger(entity) ? entity : entity instanceof Object ? entity.index : world.capacity;
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


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EventHandler = function() {
    this.events = {};
    return this;
};

Entities.EventHandler.EmptyPromise = function() {
    return new Promise(function(resolve, reject) {
        resolve();
    });
};

Entities.EventHandler.Promise = function(event, context, args, timeout) {
    
    if (timeout) {
        return new Promise(function(resolve, reject) {
            setTimeout(function(){
                resolve(event.apply(context, args));
            }, timeout);
        });
    }
    
    return new Promise(function(resolve, reject) {
        resolve(event.apply(context, args));
    });
};
                
Entities.EventHandler.prototype = {
    constructor : Entities.EventHandler,
    
    listen : function(event, handler, callback) {
        if (typeof event !== 'string' || typeof handler !== 'string' || typeof callback !== 'function') {
            return;
        }
        
        if (!Array.isArray(this.events[event])) {
            this.events[event] = [];
        }
        
        this.events[event][handler] = callback;
    },
    
    stopListening : function(event, handler) {
        if (typeof event !== 'string' || typeof handler !== 'string') {
            return;
        }
        
        if (!this.events[event] || !this.events[event][handler]) {
            return;
        }
        
        delete this.events[event][handler];
    },
    
    trigger : function() {
        let args  = arguments;
        let event = Array.prototype.splice.call(args, 0, 1)[0];
        
        if (typeof event !== 'string') {
            return Entities.EventHandler.EmptyPromise();
        }
        
        let self    = this instanceof Entities.EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (!self.events[event]) {
            return Entities.EventHandler.EmptyPromise();
        }
        
        let keys     = Object.keys(self.events[event]);
        let promises = [];
        
        let i = keys.length - 1;
        while (i >= 0) {
            if (self.events[event][keys[i]]) {
                promises.push(Entities.EventHandler.Promise(self.events[event][keys[i]], context, args));
            }
            
            --i;
        }
        
        return Promise.all(promises);
    },
    
    triggerDelayed : function() {
        let args  = arguments;
        let event = Array.prototype.splice.call(args, 0, 1)[0];
        
        if (typeof event !== 'string') {
            return Entities.EventHandler.EmptyPromise();
        }
        
        let timeout = Array.prototype.splice.call(args, 0, 1)[0];
        
        if (!Number.IsInteger(timeout)) {
            return Entities.EventHandler.EmptyPromise();
        }
        
        let self    = this instanceof Entities.EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (!self.events[event]) {
            return Entities.EventHandler.EmptyPromise();
        }
        
        let keys     = Object.keys(self.events[event]);
        let promises = [];
        
        let addPromise = function(index) {
            promises.push(Entities.EventHandler.Promise(self.events[event][keys[index]], context, args, timeout));
        };
        
        let i = keys.length - 1;
        while (i >= 0) {
            if (self.events[event][keys[i]]) {
                addPromise(i);
            }
            
            --i;
        }
        
        return Promise.all(promises);
    },
};


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.SystemManager = function() {
    this.initSystems    = [];
    this.logicSystems   = [];
    this.renderSystems  = [];
    this.cleanUpSystems = [];
    
    return this;
};

Entities.SystemManager.Type = {
    Init    : 0,
    Logic   : 1,
    Render  : 2,
    CleanUp : 3
};

Entities.SystemManager.prototype = {
    constructor : Entities.SystemManager,
    
    registerSystem : function(type, mask, callback) {
        if (typeof callback !== 'function') {
            //todo add logging ?
            
            return;
        }
        
        if (type === undefined || type === null) {
            type = Entities.SystemManager.Type.Logic;
        }
        
        let system = {
            mask     : mask,
            callback : callback
        };
        
        switch (type) {
            case Entities.SystemManager.Type.Init:    this.initSystems.push(system);    break;
            case Entities.SystemManager.Type.Logic:   this.logicSystems.push(system);   break;
            case Entities.SystemManager.Type.Render:  this.renderSystems.push(system);  break;
            case Entities.SystemManager.Type.CleanUp: this.cleanUpSystems.push(system); break;
        }
    }
};


/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.World = function(capacity) {
    
    this.capacity = Number.isInteger(capacity) ? capacity : 100;
    
    this.currentMaxEntity = 0;
    
    this.entities = [];
    
    let i = 0;
    while (i < this.capacity) {
        this.entities[i] = { index : i, id : 0 };
        
        ++i;
    }
    
    this.components = [{
        id     : Entities.World.None,
        type   : null,
        object : null
    }];
    
    return this;
};

Entities.World.None = 0;

Entities.World.ComponentType = {
    Dynamic     : 0,
    SemiDynamic : 1,
    Static      : 2
};

Entities.World.getNextComponentTypeId = function(components) {
    if (!Array.isArray(components)) {
        return 0;
    }
    
    let arr  = [];
    let keys = Object.keys(components);
    
    let i = 0, length = keys.length;
    while (i < length) {
        arr.push(components[keys[i]].id);
        
        ++i;
    }
    
    let max = Math.max.apply(null, arr);
    
    return max === undefined || max === null || max === -Infinity ? 0: max === 0 ? 1 : max * 2;
};

Entities.World.newComponent = function(object) {
    if (object === null || object === undefined) {
        return null;
    }
    
    let type = typeof object;
    
    if (type === 'function') {
        return new object();
    }
    
    if (type === 'object') {
        return (function (object) {
            var ret  = {};
            var keys = Object.keys(object);
            
            var i = 0, length = keys.length;
            while (i < length) {
                ret[keys[i]] = object[keys[i]];
                ++i;
            }
            
            return ret;
        })(object);
    }
    
    return object;
};

Entities.World.getEntities = function(world, returnDetails) {
    if (!(world instanceof Entities.World)) {
        return [];
    }
    
    if (returnDetails) {
        return world.entities;
    }
        
    let ret = [];

    let i = 0;    
    while (i <= world.currentMaxEntity) {
        if (world.entities[i].id !== Entities.World.None) {
            ret.push(i);
        }
        
        ++i;
    }
    
    return ret;
};

Entities.World.prototype = {
    constructor : Entities.World,
    
    registerComponent : function(type, object, returnDetails) {
        let id = Entities.World.getNextComponentTypeId(this.components);
        
        let component = {
            id     : id,
            type   : type,
            object : object
        };
        
        this.components.push(component);
        
        if (type === Entities.World.ComponentType.Static) {
            let entity = 0;
            
            while (entity < this.capacity) {
                this.entities[entity][id] = Entities.World.newComponent(object);
                
                ++entity;
            }
        }
        
        return returnDetails ? this.components[id] : id;
    },
    
    addComponent : function(entity, component, returnDetails) {
        if (!this.components[component]) {
            throw new Error('cannot add component: there is no registered component template ', component);
        }

        if ((this.entities[entity].id & this.components[component].id) === this.components[component].id) {
            return;
        }
        
        this.entities[entity].id |= this.components[component].id;
        
        if (this.components[component].type === Entities.World.ComponentType.Static) {
            return;
        }
        
        if (this.entities[entity][component] !== null && this.entities[entity][component] !== undefined) {
            return;
        }
        
        this.entities[entity][component] = Entities.World.newComponent(this.components[component].object);
        
        return returnDetails ? this.entities[entity][component] : component;
    },
    
    removeComponent : function(entity, component) {
        if (!this.components[component]) {
            throw 'cannot remove component: there is no registered component template ' + component;
        }
        
        if ((this.entities[entity].id & this.components[component].id) !== this.components[component].id) {
            return;
        }
        
        this.entities[entity].id &= ~this.components[component].id;
        
        if (this.components[component].type === Entities.World.ComponentType.Static ||
            this.components[component].type === Entities.World.ComponentType.SemiDynamic) {
            return;
        }
        
        if (this.entities[entity][component] === null || this.entities[entity][component] === undefined) {
            return;
        }
        
        this.entities[entity][component] = null;
    },
    
    getFirstUnusedEntity : function() {
        let entity = 0;
        
        while (entity < this.capacity) {
            if (this.entities[entity] && this.entities[entity].id === Entities.World.None) {
                return entity;
            }
            
            ++entity;
        }
        
        return this.capacity;
    },
    
    addEntity : function(components, returnDetails) {
        let entity = this.getFirstUnusedEntity();
        
        if (entity === this.capacity) {
            
            let i = this.capacity, length = (this.capacity *= 2);
            while (i < length) {
                this.entities[i] = { index : i, id : 0 };
                
                ++i;
            }
        }
        
        if (entity > this.currentMaxEntity) {
            this.currentMaxEntity = entity;
        }
        
        let componentId = Entities.World.None;
        let keys        = Object.keys(this.components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            componentId = this.components[keys[i]].id;
            
            if ((components & componentId) === componentId) {
                this.addComponent(entity, componentId);
            } else {
                this.removeComponent(entity, componentId);
            }
            
            ++i;
        }
        
        return returnDetails ? this.entities[entity] : entity;
    },
    
    removeEntity : function(entity) {
        if (entity > this.currentMaxEntity) {
            return;
        }
        
        let keys = Object.keys(this.components);
        
        let i = 0, length = keys.length;
        while (i < length) {
            this.removeComponent(entity, keys[i]);
            
            ++i;
        }
        
        if (entity <= this.currentMaxEntity) {
            return;
        }
        
        i = entity;
        
        while (i >= 0) {
            if (this.entities[i].id !== Entities.World.None) {
                this.currentMaxEntity = i;
            }
            
            --i;
        }
    },
    
    getEntities : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
        
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && (this.entities[i].id & components) === components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    },
    
    getEntitiesExact : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
    
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && this.entities[i].id === components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    },
    
    getEntitiesExcept : function(components, returnDetails) {
        if (!components) {
            return Entities.World.getEntities(this, returnDetails);
        }
    
        let ret = [];
        
        let i = 0;
        while (i <= this.currentMaxEntity) {
            if (this.entities[i].id !== Entities.World.None && (this.entities[i].id & components) !== components) {
                ret.push(returnDetails ? this.entities[i] : i);
            }
            
            ++i;
        }
        
        return ret;
    }
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
