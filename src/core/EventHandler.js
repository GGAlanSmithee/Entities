/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EventHandler = function() {
    this.events = {};
    return this;
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
        
        let self = this instanceof Entities.EntityManager ? this.eventHandler : this;
        
        if (!self.events[event]) {
            return;
        }
        
        let keys = Object.keys(self.events[event]);
        
        let i = keys.length - 1;
        while (i >= 0) {
            if (self.events[event][keys[i]]) {
                self.events[event][keys[i]].apply(this, arguments);
            }
            
            --i;
        }
    }
};