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
    
    registerSystem(type, components, callback) {
        if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
            throw TypeError('type must be a valid SystemType.')
        }
        
        if (typeof components !== 'number')  {
            throw TypeError('components must be a number.')
        }
        
        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function.')
        }
        
        const system = {
            components,
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
