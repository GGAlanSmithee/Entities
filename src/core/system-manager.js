import { containsAll } from '../util/contains-all'
import { validateAndThrow, } from '../validate'
import { doesNotContain, } from '../validate/does-not-contain'
import { isNonEmptyString } from '../validate/is-non-empty-string'
import { isPositiveInteger } from '../validate/is-positive-integer'
import { isOneOf } from  '../validate/is-one-of'
import { isArray, } from '../validate/is-array'
import { isFunction, } from '../validate/is-function'

export const SystemType = {
    Logic  : 0,
    Render : 1,
    Init   : 2
}

class SystemManager {
    constructor() {
        this.init()
    }
    
    init() {
        this.logicSystems  = new Map()
        this.renderSystems = new Map()
        this.initSystems   = new Map()
    }

    addEntity(entityId, entityComponents) {
        if (!isPositiveInteger(entityId)) {
            return
        }
        
        if (!isArray(entityComponents)) {
            return
        }

        for (const { components, entities, } of this.logicSystems.values()) {
            if (!entities.includes(entityId) && containsAll(entityComponents, components)) {
                entities.push(entityId)
            }
        }

        for (const { components, entities, } of this.renderSystems.values()) {
            if (!entities.includes(entityId) && containsAll(entityComponents, components)) {
                entities.push(entityId)
            }
        }

        for (const { components, entities, } of this.initSystems.values()) {
            if (!entities.includes(entityId) && containsAll(entityComponents, components)) {
                entities.push(entityId)
            }
        }
    }

    removeEntity(entityId) {
        if (!isPositiveInteger(entityId)) {
            return
        }

        for (let system of this.logicSystems.values()) {
            if (system.entities.includes(entityId)) {
                system.entities = system.entities.filter(e => e !== entityId)
            }
        }

        for (let system of this.renderSystems.values()) {
            if (system.entities.includes(entityId)) {
                system.entities = system.entities.filter(e => e !== entityId)
            }
        }

        for (let system of this.initSystems.values()) {
            if (system.entities.includes(entityId)) {
                system.entities = system.entities.filter(e => e !== entityId)
            }
        }
    }
    
    registerSystem(type, key, components, entities, callback) {
        validateAndThrow(
            TypeError,
            isOneOf(SystemType, type, 'type'),
            isNonEmptyString(key, 'key'),
            isArray(components, 'components'),
            isArray(entities, 'entities'),
            isFunction(callback, 'callback'),
            doesNotContain(this.logicSystems, key, 'logic systems map'),
            doesNotContain(this.renderSystems, key, 'render systems map'),
            doesNotContain(this.initSystems, key, 'init systems map'),
        )

        const system = {
            components,
            entities,
            callback
        }
        
        switch (type) {
            case SystemType.Logic : this.logicSystems.set(key, system); break
            case SystemType.Render : this.renderSystems.set(key, system); break
            case SystemType.Init : this.initSystems.set(key, system); break
        }
    }
    
    removeSystem(key) {
        return (
            this.logicSystems.delete(key) ||
            this.renderSystems.delete(key) ||
            this.initSystems.delete(key)
        )
    }
}

export { SystemManager }
