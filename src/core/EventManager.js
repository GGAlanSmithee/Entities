/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EventManager = function() {
    this.events = {};
    return this;
};

Entities.EventManager.prototype = {
    constructor : Entities.EventManager,
    
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
        
        if (!this.events[event]) {
            return;
        }
        
        this.events[event][handler] = null;
    },
    
    trigger : function() {
        let event = Array.prototype.splice.call(arguments, 0, 1)[0];
        
        if (typeof event !== 'string') {
            return;
        }
        
        if (!this.events[event]) {
            return;
        }
        
        let keys = Object.keys(this.events[event]);
        
        let i = keys.length - 1;
        while (i >= 0) {
            if (this.events[event][keys[i]]) {
                this.events[event][keys[i]].apply(null, arguments);
            }
            
            --i;
        }
    }
};