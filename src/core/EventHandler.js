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
                promises.push(new Promise(function(resolve, reject) {
                    resolve(self.events[event][keys[i]].apply(context, args));
                }));
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
        
        if (typeof timeout !== 'number') {
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
                (function(index) {
                    promises.push(new Promise(function(resolve, reject) {
                        setTimeout(function(){
                            resolve(self.events[event][keys[index]].apply(context, args));
                        }, timeout);
                    }));
                })(i);
            }
            
            --i;
        }
        
        return Promise.all(promises);
    },
};