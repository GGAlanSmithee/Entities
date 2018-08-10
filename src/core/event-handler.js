import { isEntityManager, } from '../validate/is-entity-manager'
import { isNonEmptyString, } from '../validate/is-non-empty-string'
import { contains, } from '../validate/contains'
import { isFunction, } from '../validate/is-function'
import { isPositiveInteger, } from '../validate/is-positive-integer'
import { promise, emptyPromise } from '../util/promise'
    
class EventHandler {
    constructor() {
        this._events = new Map()
    }
    
    listen(event, callback) {
        if (!isNonEmptyString(event) || !isFunction(callback)) {
            return
        }
        
        if (!contains(this._events, event)) {
            this._events.set(event, new Map())
        }
        
        let eventId = -1
        
        this._events.forEach(event => {
            eventId = Math.max(eventId, ...event.keys())
        })
        
        ++eventId
        
        this._events.get(event).set(eventId, callback)
        
        return eventId
    }
    
    stopListen(eventId) {
        for (const events of this._events.values()) {
            for (const id of events.keys()) {
                if (id === eventId) {
                    return events.delete(eventId)
                }
            }
        }

        return false
    }
    
    trigger() {
        const self = isEntityManager(this) ? this.eventHandler : this
        
        const args = Array.from(arguments)
        
        const [ event ] = args.splice(0, 1)

        if (!isNonEmptyString(event) || !contains(self._events, event)) {
            return emptyPromise()
        }

        const promises = []
        
        for (let callback of self._events.get(event).values()) {
            promises.push(promise(callback, this, args))
        }

        return Promise.all(promises)
    }
    
    triggerDelayed() {
        const self = isEntityManager(this) ? this.eventHandler : this
        
        const args = Array.from(arguments)
        
        const [ event, timeout ] = args.splice(0, 2)
        
        if (!isNonEmptyString(event) || !isPositiveInteger(timeout) || !contains(self._events, event)) {
            return emptyPromise()
        }

        const promises = []
        
        for (let callback of self._events.get(event).values()) {
            promises.push(promise(callback, this, args, timeout))
        }

        return Promise.all(promises)
    }
}

export { EventHandler }
