import { EntityFactory }             from './entity-factory'
import { ComponentManager }          from './component-manager'
import { SystemManager, SystemType } from './system-manager'
import { EventHandler }              from './event-handler'

class EntityManager {
    constructor(capacity = 1000) {
        this.capacity         = capacity
        this.currentMaxEntity = -1
        
        this.entityFactory    = new EntityFactory()
        this.systemManager    = new SystemManager()
        this.componentManager = new ComponentManager()
        this.eventHandler     = new EventHandler()
        
        this.entities = Array.from({ length : this.capacity }, () => ({ components: [ ] }))
        
        this.entityConfigurations = new Map()
    }
    
    increaseCapacity() {
        let oldCapacity = this.capacity
        
        this.capacity *= 2
        
        this.entities = [...this.entities, ...Array.from({ length : oldCapacity }, () => ({ components: [ ] }))]

        for (let i = oldCapacity; i < this.capacity; ++i) {
            for (let component of this.componentManager.getComponents().keys()) {
                this.entities[i][component] = this.componentManager.newComponent(component)
            }
        }
    }
    
    newEntity(components) {
        if (!Array.isArray(components)) {
            throw TypeError('components argument must be an array of components.')
        }
        
        let id = 0
        
        for (; id < this.capacity; ++id) {
            if (this.entities[id].components.length === 0) {
                break
            }
        }
        
        if (id >= this.capacity) {
            // todo: auto increase capacity?
            return { id : this.capacity, entity : null }
        }
        
        if (id > this.currentMaxEntity) {
            this.currentMaxEntity = id
        }
        
        this.entities[id].components = components
        
        return { id, entity : this.entities[id] }
    }
    
    deleteEntity(id) {
        this.entities[id].components = []
        
        if (id < this.currentMaxEntity) {
            return
        }
        
        for (let i = id; i >= 0; --i) {
            if (this.entities[i].components.length !== 0) {
                this.currentMaxEntity = i
                
                return
            }
        }

        this.currentMaxEntity = 0
    }

    *getEntities(components = null) {
        for (let id = 0; id <= this.currentMaxEntity; ++id) {
            if (components === null || components.every(component => this.entities[id].components.indexOf(component) !== -1)) {
                yield { id, entity : this.entities[id] }
            }
        }
    }
    
    registerConfiguration(key) {
        if (typeof key !== 'string' || key === '') {
            throw TypeError('key must be a non empty string.')
        }
        
        this.entityConfigurations.set(key, this.entityFactory.createConfiguration())
        
        return key
    }
    
    // Component Manager
    
    registerComponent(key, component) {
        this.componentManager.registerComponent(key, component)
        
        for (let entity of this.entities) {
            entity[key] = this.componentManager.newComponent(key)
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
        
        this.entityFactory.registerInitializer(key, initializer)
        
        return key
    }
    
    addComponent(id, componentKey) {
        if (this.entities[id].components.indexOf(componentKey) !== -1) {
            return
        }
        
        this.entities[id].components.push(componentKey)
    }
    
    removeComponent(id, component) {
        let index = this.entities[id].components.indexOf(component)
        
        if (index === -1) {
            return
        }
        
        this.entities[id].components.splice(index, 1)
    }
    
    // System Manager
    
    registerSystem(key, type, components, callback) {
        return this.systemManager.registerSystem(key, type, components, callback)
    }
    
    registerLogicSystem(key, components, callback) {
        return this.systemManager.registerSystem(key, SystemType.Logic, components, callback)
    }
    
    registerRenderSystem(key, components, callback) {
        return this.systemManager.registerSystem(key, SystemType.Render, components, callback)
    }
    
    registerInitSystem(key, components, callback) {
        return this.systemManager.registerSystem(key, SystemType.Init, components, callback)
    }
    
    removeSystem(key) {
        return this.systemManager.removeSystem(key)
    }
    
    onLogic(opts) {
        for (let system of this.systemManager.logicSystems.values()) {
            system.callback.call(this, this.getEntities(system.components), opts)
        }
    }
    
    onRender(opts) {
        for (let system of this.systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntities(system.components), opts)
        }
    }

    onInit(opts) {
        for (let system of this.systemManager.initSystems.values()) {
            system.callback.call(this, this.getEntities(system.components), opts)
        }
    }
    
    // Entity Factory
    
    registerInitializer(componentId, initializer) {
        this.entityFactory.registerInitializer(componentId, initializer)
    }
    
    build() {
        this.entityFactory.build()
        
        return this
    }
    
    withComponent(componentId, initializer) {
        this.entityFactory.withComponent(componentId, initializer)
        
        return this
    }
    
    create(count, key) {
        let configuration = undefined
        
        if (typeof key === 'string') {
            configuration = this.entityConfigurations.get(key)
            
            if (configuration === undefined) {
                throw TypeError('could not find entity configuration for the supplied key. if you wish to create an entity without a configuration, do not pass a key.')
            }
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