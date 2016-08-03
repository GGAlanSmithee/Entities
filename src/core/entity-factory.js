import { EntityManager } from './entity-manager'

class EntityFactory {
    constructor() {
        this.initializers  = new Map()
        this.configuration = new Map()
    }
    
    registerInitializer(id, initializer) {
        if (!Number.isInteger(id) || id <= 0) {
            throw TypeError('id must be a posetive integer.')
        }
        
        if (typeof initializer !== 'function') {
            throw TypeError('initializer must be a function.')
        }
        
        this.initializers.set(id, initializer)
    }
    
    unregisterInitializer(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw TypeError('id must be a number over 0.')
        }
        
        return this.initializers.delete(id)
    }
    
    build() {
        this.configuration = new Map()
        
        return this
    }
    
    withComponent(componentId, initializer) {
        if (!Number.isInteger(componentId) || componentId <= 0) {
            return this
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(componentId)
        }
        
        this.configuration.set(componentId, initializer)
        
        return this
    }
    
    createConfiguration() {
        return this.configuration
    }
    
    create(entityManager, count = 1, configuration = undefined) {
        if (!(entityManager instanceof EntityManager)) {
            return []
        }
    
        if (configuration == null) {
            configuration = this.configuration
        }
        
        const components = Array.from(configuration.keys()).reduce((curr, next) => curr |= next, 0)
        
        let entities = []
        
        for (let i = 0; i < count; ++i) {
            let { id, entity } = entityManager.newEntity(components)
            
            if (id >= entityManager.capacity) {
                break
            }
            
            for (let [component, initializer] of configuration) {
                if (typeof initializer !== 'function') {
                    continue
                }

                let result = initializer.call(entity[component])
                
                if (typeof entity[component] !== 'object' && result !== undefined) {
                    entity[component] = result
                }
            }
            
            entities.push({ id, entity })
        }
        
        return entities.length === 1 ? entities[0] : entities
    }
}

export { EntityFactory }
