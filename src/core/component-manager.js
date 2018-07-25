import { validateAndThrow, } from '../validate'
import { isNonEmptyString, } from '../validate/is-non-empty-string'
import { isDefined, } from '../validate/is-defined'
import { doesNotContain, } from '../validate/does-not-contain'

class ComponentManager {
    constructor() {
        this._components = new Map()
    }
    
    newComponent(key) {
        let component = this._components.get(key)
        
        if (!isDefined(component)) {
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
        validateAndThrow(
            isNonEmptyString(key, 'key'),
            isDefined(component, 'component'),
            doesNotContain(this._components, key, `component with ${key} already registered.`)
        )

        this._components.set(key, component)
    }
    
    get components() {
        return this._components
    }
}

export { ComponentManager }
