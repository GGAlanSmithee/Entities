class ComponentManager {
    constructor() {
        this.components = new Map()
    }
    
    newComponent(key) {
        let component = this.components.get(key)
        
        if (component == null) {
            return null
        }
        
        switch (typeof component) {
            case 'function':
                return new component()
            case 'object'  : {
                return ((component) => {
                    let ret = {}
                    
                    Object.keys(component).forEach(key => ret[key] = component[key])
                    
                    return ret
                })(component)
            }
            default:
                return component
        }
    }
    
    registerComponent(key, component) {
        if (typeof key !== 'string' || key === '') {
            throw TypeError('key must be a non-empty string.')
        }
        
        if (component === null || component === undefined) {
            throw TypeError('component cannot be null or undefined.')
        }
        
        this.components.set(key, component)

        return key
    }
    
    getComponents() {
        return this.components
    }
}

export { ComponentManager }
