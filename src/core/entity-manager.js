import { containsAll }               from '../util/contains-all'
import { EntityFactory }             from './entity-factory'
import { ComponentManager }          from './component-manager'
import { SystemManager, SystemType } from './system-manager'
import { EventHandler }              from './event-handler'

class EntityManager {
    constructor(capacity = 1000) {        
        this.capacity         = capacity
        
        this.entityFactory    = new EntityFactory()
        this.systemManager    = new SystemManager()
        this.componentManager = new ComponentManager()
        this.eventHandler     = new EventHandler()
        
        this.entityConfigurations = new Map()
        
        this.entities = Array.from({ length : this.capacity }, (id) => ({ id, components: [] }))
    }

    increaseCapacity() {
        let oldCapacity = this.capacity
        
        this.capacity *= 2
        
        this.entities = [...this.entities, ...Array.from({ length : oldCapacity }, (i) => ({ id: oldCapacity + i, components: 0 }))]

        for (let i = oldCapacity; i < this.capacity; ++i) {
            let entity = this.entities[i]
            
            for (const componentName of this.componentManager.components.keys()) {
                entity[componentName] = this.componentManager.newComponent(componentName)
            }
        }
    }
    
    newEntity(components) {
        if (!Array.isArray(components)) {
            return null
        }

        let id = 0
        
        // todo: if re-using an old entity, should we reset components?
        for (; id < this.capacity; ++id) {
            if (this.entities[id].components.length === 0) {
                break
            }
        }
        
        if (id >= this.capacity) {
            // todo: auto increase capacity?
            return null
        }
        
        this.entities[id].components = components

        this.systemManager.addEntity(id, components)

        return this.entities[id] || null
    }
    
    deleteEntity(id) {
        if (!Number.isInteger(id) || id < 0) {
            return
        }

        this.systemManager.removeEntity(id)
        
        this.entities[id].components = []
    }

    getEntity(id) {
        if (!Number.isInteger(id) || id < 0) {
            return null
        }

        return this.entities[id]
    }

    hasComponent(id, component) {
        if (typeof component !== 'string') {
            return false
        }

        const entity = this.getEntity(id)

        if (!entity) {
            return false
        }

        return entity.components.includes(component)
    }

    *iterateEntities(components = []) {
        if (components.length === 0) {
            return components
        }

        for (const entity of this.entities.filter(e => containsAll(components, e.components))) {
            yield entity
        }
    }

    *getEntitiesByIds(ids = []) {
        if (!Array.isArray(ids)) {
            return
        }

        for (const id of ids) {
            if (Number.isInteger(id) && id >= 0 && id < this.entities.length) {
                yield this.entities[id]
            }
        }
    }
    
    registerConfiguration() {
        const configurationId = Math.max(0, ...this.entityConfigurations.keys()) + 1
        
        this.entityConfigurations.set(configurationId, this.entityFactory.createConfiguration())
        
        return configurationId
    }
    
    // Component Manager
    
    registerComponent(name, component) {
        if (typeof name !== 'string' || name.length === 0) {
            throw TypeError('name must be a non-empty string.')
        }

        this.componentManager.registerComponent(name, component)
        
        for (let entity of this.entities) {
            entity[name] = this.componentManager.newComponent(name)
        }
        
        let initializer

        switch (typeof component) {
            case 'function': initializer = component; break
            case 'object': {
                initializer = function() {
                    for (let key of Object.keys(component)) {
                        this[key] = component[key]
                    }
                }
            
                break
            }
            default: initializer = function() { return component }; break
        }
        
        this.entityFactory.registerInitializer(name, initializer)
    }
    
    addComponent(entityId, component) {
        if (typeof component !== 'string') {
            return
        }

        if (!this.entities[entityId].components.include(component)) {
            this.entities[entityId].components.push(component)
        }
    }
    
    removeComponent(entityId, component) {
        this.entities[entityId].components = this.entities[entityId].components.filter(c => c !== component)
    }
    
    // System Manager
    
    registerSystem(type, components, callback) {
        if (!Array.isArray(components)) {
            throw TypeError('components must be an array of components')
        }
        
        const entities = []
        
        for (const { id, } of this.iterateEntities(components)) {
            entities.push(id)
        }

        return this.systemManager.registerSystem(type, components, entities, callback)
    }
    
    registerLogicSystem(components, callback) {
        return this.registerSystem(SystemType.Logic, components, callback)
    }
    
    registerRenderSystem(components, callback) {
        return this.registerSystem(SystemType.Render, components, callback)
    }
    
    registerInitSystem(components, callback) {
        return this.registerSystem(SystemType.Init, components, callback)
    }
    
    removeSystem(systemId) {
        return this.systemManager.removeSystem(systemId)
    }
    
    onLogic(opts) {
        for (let system of this.systemManager.logicSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }
    
    onRender(opts) {
        for (let system of this.systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }

    onInit(opts) {
        for (let system of this.systemManager.initSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }
    
    // Entity Factory
    
    registerInitializer(component, initializer) {
        this.entityFactory.registerInitializer(component, initializer)
    }
    
    build() {
        this.entityFactory.build()
        
        return this
    }
    
    withComponent(component, initializer) {
        this.entityFactory.withComponent(component, initializer)
        
        return this
    }
    
    create(count, configurationId) {
        let configuration = undefined
        
        if (Number.isInteger(configurationId) && configurationId > 0) {
            configuration = this.entityConfigurations.get(configurationId)
            
            if (configuration === undefined) {
                throw Error('Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.')
            }
        }

        if (configurationId !== null && configurationId !== undefined && !Number.isInteger(configurationId)) {
            throw Error('configurationId should be an integer if using a save configuration, or undefined if not.')
        }
        
        return this.entityFactory.create(this, count, configuration)
    }
    
    // Event Handler
    
    listen(event, callback) {
        return this.eventHandler.listen(event, callback)
    }
    
    stopListen(eventId) {
        return this.eventHandler.stopListen(eventId)
    }
    
    trigger() {
        return this.eventHandler.trigger.call(this, ...arguments)
    }
    
    triggerDelayed() {
        return this.eventHandler.triggerDelayed.call(this, ...arguments)
    }
}

export { EntityManager }
