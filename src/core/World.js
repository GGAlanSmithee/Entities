/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

'use strict';

Entities.World = function(size, type) {
    this.ComponentType = {
        None : 0
    };
    
    this.Size = size ? size : 100;
    
    this.Type = type !== undefined ? type : Entities.World.Type.Static;
    
    this.Mask = [];
    
    for (var i = 0; i < this.Size; ++i) {
        this.Mask.push(this.ComponentType.None);
    }
};

Entities.World.Type = {
    Dynamic : 0,
    SemiDynamic : 1,
    Static : 2
};

Entities.World.prototype = {
    constructor : Entities.World,
    
    MinRatio : 0.0,
    
    MaxRatio : 4.0,
    
    registerComponent : function(component, ratio) {
        var arr = [];
            
        for (var type in this.ComponentType) {
           if (this.ComponentType.hasOwnProperty(type)) {
                arr.push(this.ComponentType[type]);
            }
        }
        
        var max = Math.max.apply(null, arr);
        
        this.ComponentType[component.name] = max === undefined || max === null ? 0: max === 0 ? 1 : max * 2;
        
        if (this[component.name]) {
            return;
        }
        
        this[component.name] = [];
        
        if (this.Type === Entities.World.Type.Dynamic || this.Type === Entities.World.Type.SemiDynamic) {
            return;
        }
        
        for (var i = 0; i < this.Size; ++i) {
            this[component.name].push(new global[component.name]());
        }
    }
};

Object.defineProperty(Entities.World.prototype, "Mask", {
    get: function() {
        return this._mask;
    },
    set: function(mask) {
        this._mask = mask;
    }
});

Object.defineProperty(Entities.World.prototype, "Size", {
    get: function() {
        return this._size;
    },
    set: function(size) {
        this._size = size;
    }
});

Object.defineProperty(Entities.World.prototype, "Type", {
    get: function() {
        return this._type;
    },
    set: function(type) {
        this._type = type;
    }
});

Object.defineProperty(Entities.World.prototype, "ComponentType", {
    get: function() {
        return this._componentType;
    },
    set: function(componentType) {
        this._componentType = componentType;
    }
});