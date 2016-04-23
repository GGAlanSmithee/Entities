import EntityManager from './entity-manager';

export default class EventHandler {
    constructor() {
        this.events = new Map();
    }
    
    emptyPromise() {
        return new Promise(resolve => {
            resolve();
        });
    }
    
    promise(callback, context, args, timeout) {
        if (timeout) {
            return new Promise(resolve => {
                setTimeout(function(){
                    resolve(typeof context ===  'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
                }, timeout);
            });
        }
        
        return new Promise(resolve => {
            resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
        });
    }
    
    listen(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, new Map());
        }
        
        let eventId = -1;
        
        this.events.forEach(event => {
            eventId = Math.max(eventId, ...event.keys());
        });
        
        ++eventId;
        
        this.events.get(event).set(eventId, callback);
        
        return eventId;
    }
    
    stopListen(eventId) {
        for (let events of this.events.values()) {
            for (let id of events.keys()) {
                if (id === eventId) {
                    return events.delete(eventId);
                }
            }
        }

        return false;
    }
    
    trigger() {
        let self = this instanceof EntityManager ? this.eventHandler : this;
        
        let args = Array.from(arguments);
        
        let [ event ] = args.splice(0, 1);
        
        if (typeof event !== 'string' || !self.events.has(event)) {
            return self.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, this, args, 1));
        }
        
        return Promise.all(promises);
    }
    
    triggerDelayed() {
        let self = this instanceof EntityManager ? this.eventHandler : this;
        
        let args = Array.from(arguments);
        
        let [ event, timeout ] = args.splice(0, 2);
        
        if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
            return self.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, this, args, timeout));
        }
        
        return Promise.all(promises);
    }
}