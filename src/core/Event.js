import EntityManager from './Entity';

export default class EventHandler {
    constructor() {
        this.events = new Map();
    }

    emptyPromise() {
        return new Promise(function(resolve, reject) {
            resolve();
        });
    }

    promise(callback, context, args, timeout) {
        if (timeout) {
            return new Promise(function(resolve, reject) {
                setTimeout(function(){
                    resolve(callback.apply(context, ...args));
                }, timeout);
            });
        }
        
        return new Promise(function(resolve, reject) {
            resolve(callback.apply(context, ...args));
        });
    }
    
    getNextEventId() {
        let max = -1;
        
        this.events.forEach(event => {
            max = Math.max(max, ...event.keys());
        });
        
        return max + 1;
    }
    
    listen(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, new Map());
        }
        
        let eventId = this.getNextEventId();
        
        this.events.get(event).set(eventId, callback);
        
        return eventId;
    }
    
    stopListen(eventId) {
        if (!Number.isInteger(eventId)) {
            return false;
        }

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
        let args  = arguments;
        let event = args.splice(0, 1)[0];
        
        if (typeof event !== 'string') {
            return this.emptyPromise();
        }
        
        let self    = this instanceof EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (!self.events.has(event)) {
            return this.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, context, args));
        }
        
        return Promise.all(promises);
    }
    
    triggerDelayed() {
        let args  = arguments;
        let event = args.splice(0, 1)[0];
        
        if (typeof event !== 'string') {
            return this.emptyPromise();
        }
        
        let timeout = args.splice(0, 1)[0];
        
        if (!Number.isInteger(timeout)) {
            return this.emptyPromise();
        }
        
        let self    = this instanceof EntityManager ? this.eventHandler : this;
        let context = this;
        
        if (!self.events.has(event)) {
            return this.emptyPromise();
        }
        
        let promises = [];
        
        for (let callback of self.events.get(event).values()) {
            promises.push(self.promise(callback, context, args, timeout));
        }
        
        return Promise.all(promises);
    }
}