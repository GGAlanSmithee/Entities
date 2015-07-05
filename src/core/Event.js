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

    promise(event, context, args, timeout) {
        if (timeout) {
            return new Promise(function(resolve, reject) {
                setTimeout(function(){
                    resolve(event.apply(context, ...args));
                }, timeout);
            });
        }
        
        return new Promise(function(resolve, reject) {
            resolve(event.apply(context, ...args));
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
            this.events.add(event, new Map());
        }
        
        let eventId = this.getNextEventId();
        
        this.events.get(event).set(eventId, callback);
        
        return eventId;
    }
    
    stopListening(event, eventId) {
        if (this.events.has(event) && this.events.get(event).has(eventId)) {
            this.events.get(event).delete(eventId);
        }
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
        
        for (let event of self.events.get(event).values()) {
            promises.push(self.promise(event, context, args));
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
        
        for (let event of self.events.get(event).values()) {
            promises.push(self.promise(event, context, args, timeout));
        }
        
        return Promise.all(promises);
    }
}