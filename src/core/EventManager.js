/**
* @author       Alan Smithee <ggnore.alan.smithee@gmail.com>
* @copyright    2015 GGNoRe.
* @license      {@link https://github.com/GGAlanSmithee/Entities/blob/master/LICENSE|MIT License}
*/

Entities.EventManager = function() {
    return this;
};

Entities.EventManager.prototype = {
    constructor : Entities.EventManager,
    
    listen : function(event, callback) {
        if (!Array.isArray(this.Events[event])) {
            this.Events[event] = [];
        }
        
        for (let i = 0; i < this.Events[event].length; ++i) {
            if (this.Events[event][i] === callback) {
                return;
            }
        }
        
        this.Events[event].push(callback);
    },
    
    stopListening : function(event, callback) {
        if (!event) {
            return;
        }
        
        if (!callback) {
            this.Events[event] = [];
            
            return;
        }
        
        let index = -1;
        
        this.Events[event].forEach(function(eventCallback, i)  {
            if (eventCallback === callback) {
                index = i;
            }
        });
        
        if (index < 0 || index >= this.Events[event].length) {
            return;
        }
        
        this.Events[event].splice(index, 1);
    },
    
    trigger : function(event, args) {
        this.Events[event].forEach(function(events) {
            events(args);
        });
    },
};

Object.defineProperty(Entities.EventManager.prototype, 'Events', {
    get: function() {
        return this._events ? this._events : (this._events = {});
    },
    set: function(events) {
        this._events = events;
    }
});