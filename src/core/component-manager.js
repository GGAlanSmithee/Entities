import { validateAndThrow, } from '../validate/index'
import { isNonEmptyString, } from '../validate/is-non-empty-string'
import { isDefined, } from '../validate/is-defined'
import { doesNotContain, } from '../validate/does-not-contain'

class ComponentManager {
    constructor() {
        this._components = new Map()
    }
    
    newComponent(key) {
        const component = this._components.get(key)
        
        if (!isDefined(component)) {
            return null
        }
        
        switch (typeof component) {
            case 'function':
                return new component()
            case 'object'  : {
                return ((comp) => ({ ...comp }))(component)
            }
            default:
                return component
        }
    }
    
    registerComponent(key, component) {
        validateAndThrow(
            TypeError,
            isNonEmptyString(key, 'key'),
            isDefined(component, 'component'),
            doesNotContain(this._components, key, 'components')
        )

        this._components.set(key, component)
    }
    
    get components() {
        return this._components
    }
}

export { ComponentManager }
