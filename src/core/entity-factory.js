import { EntityManager } from './entity-manager'

class EntityFactory {
    constructor() {
        this.initializers  = new Map()
        this.configuration = new Map()
    }
    
    registerInitializer(key, initializer) {
        if (typeof key !== 'string' || key === '') {
            throw TypeError('key must be a non-empty string.')
        }
        
        if (typeof initializer !== 'function') {
            throw TypeError('initializer must be a function.')
        }
        
        this.initializers.set(key, initializer)
    }
    
    build() {
        this.configuration = new Map()
        
        return this
    }
    
    withComponent(key, initializer) {
        if (typeof key !== 'string' || key === '') {
            return this
        }
        
        if (typeof initializer !== 'function') {
            initializer = this.initializers.get(key)
        }
        
        this.configuration.set(key, initializer)
        
        return this
    }
    
    createConfiguration() {
        return this.configuration
    }
    
    create(entityManager, count = 1, configuration = undefined) {
        if (!(entityManager instanceof EntityManager)) {
            return []
        }
    
        configuration = configuration || this.configuration
        
        let components = []
        
        for (let component of configuration.keys()) {
            components.push(component)
        }
        
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
