import { validateKey, } from "../utils/validate"

class ComponentManager {
    constructor() {
        this._components = new Map()
    }
    
    newComponent(key) {
        let component = this._components.get(key)
        
        if (component === null || component === undefined) {
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
        validateKey(key)

        if (component === null || component === undefined) {
            throw TypeError('component cannot be null or undefined.')
        }

        if (this._components.has(key)) {
            throw Error(`component with ${key} already registered.`)
        }

        this._components.set(key, component)
    }
    
    get components() {
        return this._components
    }
}

export { ComponentManager }
