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
        if (!Number.isInteger(entityId) || entityId < 0) {
            return
        }
        
        if (!Number.isInteger(entityComponents) || entityComponents < 0) {
            return
        }

        for (const { components, entities, } of this.logicSystems.values()) {
            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId)
                }
            }
        }

        for (const { components, entities, } of this.renderSystems.values()) {
            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId)
                }
            }
        }

        for (const { components, entities, } of this.initSystems.values()) {
            if ((entityComponents & components) === components) {
                if (!entities.some(e => e === entityId)) {
                    entities.push(entityId)
                }
            }
        }
    }

    removeEntity(entityId) {
        if (!entityId) {
            return
        }

        for (let { entities, } of this.logicSystems.values()) {
            if (entities.some(e => e === entityId)) {
                entities = entities.filter(e => e !== entityId)
            }
        }

        for (let { entities, } of this.renderSystems.values()) {
            if (entities.some(e => e === entityId)) {
                entities = entities.filter(e => e !== entityId)
            }
        }

        for (let { entities, } of this.initSystems.values()) {
            if (entities.some(e => e === entityId)) {
                entities = entities.filter(e => e !== entityId)
            }
        }
    }
    
    registerSystem(type, components, entities, callback) {
        if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
            throw TypeError('type must be a valid SystemType.')
        }

        if (typeof components !== 'number')  {
            throw TypeError('components must be a number.')
        }
        
        if (!Array.isArray(entities))  {
            throw TypeError('entities must be an array.')
        }
        
        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function.')
        }
        
        const system = {
            components,
            entities,
            callback
        }
        
        const systemId = Math.max(0, ...this.logicSystems.keys(), ...this.renderSystems.keys(), ...this.initSystems.keys()) + 1
        
        switch (type) {
            case SystemType.Logic : this.logicSystems.set(systemId, system); break
            case SystemType.Render : this.renderSystems.set(systemId, system); break
            case SystemType.Init : this.initSystems.set(systemId, system); break
        }
        
        return systemId
    }
    
    removeSystem(systemId) {
        return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId) || this.initSystems.delete(systemId)
    }
}

export { SystemManager }
