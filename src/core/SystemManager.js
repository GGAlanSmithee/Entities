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
    
    registerSystem : function(type, system) {
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