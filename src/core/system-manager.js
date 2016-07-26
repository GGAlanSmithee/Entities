export const SystemType = {
    Logic  : 0,
    Render : 1,
    Init   : 2
}

class SystemManager {
    constructor() {
        this.logicSystems  = new Map()
        this.renderSystems = new Map()
        this.initSystems   = new Map()
    }
    
    registerSystem(key, type, components, callback) {
        if (typeof key !== 'string' || key === '') {
            throw TypeError('key must be a non-empty string.')
        }
        
        if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
            throw TypeError('type must be a valid SystemType.')
        }
        
        if (!Array.isArray(components)) {
            throw TypeError('components argument must be an array of components.')
        }
        
        if (typeof callback !== 'function') {
            throw TypeError('callback must be a function.')
        }
        
        let system = {
            components,
            callback
        }
        
        switch (type) {
            case SystemType.Logic : this.logicSystems.set(key, system); break
            case SystemType.Render : this.renderSystems.set(key, system); break
            case SystemType.Init : this.initSystems.set(key, system); break
        }
        
        return key
    }
    
    removeSystem(key) {
        return this.logicSystems.delete(key) || this.renderSystems.delete(key) || this.initSystems.delete(key)
    }
}

export { SystemManager }