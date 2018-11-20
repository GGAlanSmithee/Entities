import { validateAndThrow, } from '../validate/index'
import { isNonEmptyString, } from '../validate/is-non-empty-string'
import { isEntityManager, } from '../validate/is-entity-manager'
import { isFunction, } from '../validate/is-function'
import { isObject, } from '../validate/is-object'
import { isDefined } from '../validate/is-defined'

const newConfiguration = () => ({
    components: new Map(),
    data: {},
})

class EntityFactory {
    constructor() {
        this._initializers  = new Map()
        this._configuration = newConfiguration()
    }
    
    registerInitializer(key, initializer) {
        validateAndThrow(
            TypeError,
            isNonEmptyString(key, 'key'),
            isFunction(initializer, 'initializer')
        )

        this._initializers.set(key, initializer)
    }
    
    build() {
        this._configuration = newConfiguration()
        
        return this
    }
    
    withComponent(key, initializer) {
        if (!isNonEmptyString(key)) {
            return this
        }

        if (!isFunction(initializer)) {
            initializer = this._initializers.get(key)
        }
        
        this._configuration.components.set(key, initializer)
        
        return this
    }

    withData(data) {
        if (!isObject(data)) {
            return this
        }

        this._configuration.data = data
    }
    
    createConfiguration() {
        return this._configuration
    }
    
    create(entityManager, length = 1, configuration = undefined) {
        if (!isEntityManager(entityManager)) {
            return []
        }
    
        if (configuration == null) {
            configuration = this._configuration
        }

        if (configuration == null) {
            console.warn('no configuration supplied - could not create entity.') // eslint-disable-line no-console

            return []
        }
        
        const components = Array.from(configuration.components.keys())
        
        return Array
            .from({ length, }, () => {
                const entity = entityManager.newEntity(components, configuration.data)
                
                if (entity === null) {
                    return null
                }

                for (const [component, initializer] of configuration.components) {
                    if (!isFunction(initializer)) {
                        continue
                    }

                    const result = initializer.call(entity[component])
                    
                    if (!isObject(entity[component]) && isDefined(result)) {
                        entity[component] = result
                    }
                }
                
                return entity
            })
            .filter(e => e !== null)
    }
}

export { EntityFactory }
