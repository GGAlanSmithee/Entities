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
        
        this.entityConfigurations = new Map()
        
        this.entities = Array.from({ length : this.capacity }, () => ({ components: 0 }))
    }
    
    increaseCapacity() {
        let oldCapacity = this.capacity
        
        this.capacity *= 2
        
        this.entities = [...this.entities, ...Array.from({ length : oldCapacity }, () => ({ components: 0 }))]

        for (let i = oldCapacity; i < this.capacity; ++i) {
            for (let component of this.componentManager.getComponents().keys()) {
                this.entities[i][component] = this.componentManager.newComponent(component)
            }
        }
    }
    
    newEntity(components) {
        if (!Number.isInteger(components) || components <= 0) {
            return { id : this.capacity, entity : null }
        }
        
        let id = 0
        
        for (; id < this.capacity; ++id) {
            if (this.entities[id].components === 0) {
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
        //todo add sanity check
        this.entities[id].components = 0
        
        if (id < this.currentMaxEntity) {
            return
        }
        
        for (let i = id; i >= 0; --i) {
            if (this.entities[i].components !== 0) {
                this.currentMaxEntity = i
                
                return
            }
        }

        this.currentMaxEntity = 0
    }

    *getEntities(components = 0) {
        for (let id = 0; id <= this.currentMaxEntity; ++id) {
            if (components === 0 || (this.entities[id].components & components) === components) {
                yield { id, entity : this.entities[id] }
            }
        }
    }
    
    registerConfiguration() {
        const configurationId = Math.max(0, ...this.entityConfigurations.keys()) + 1
        
        this.entityConfigurations.set(configurationId, this.entityFactory.createConfiguration())
        
        return configurationId
    }
    
    // Component Manager
    
    registerComponent(component) {
        const componentId = this.componentManager.registerComponent(component)
        
        for (let entity of this.entities) {
            entity[componentId] = this.componentManager.newComponent(componentId)
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
        
        this.entityFactory.registerInitializer(componentId, initializer)
        
        return componentId
    }
    
    addComponent(entityId, componentId) {
        this.entities[entityId].components |= componentId
    }
    
    removeComponent(entityId, componentId) {
        this.entities[entityId].components &= ~componentId
    }
    
    // System Manager
    
    registerSystem(type, components, callback) {
        return this.systemManager.registerSystem(type, components, callback)
    }
    
    registerLogicSystem(components, callback) {
        return this.systemManager.registerSystem(SystemType.Logic, components, callback)
    }
    
    registerRenderSystem(components, callback) {
        return this.systemManager.registerSystem(SystemType.Render, components, callback)
    }
    
    registerInitSystem(components, callback) {
        return this.systemManager.registerSystem(SystemType.Init, components, callback)
    }
    
    removeSystem(systemId) {
        return this.systemManager.removeSystem(systemId)
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
    
    create(count, configurationId) {
        let configuration = undefined
        
        if (Number.isInteger(configurationId) && configurationId > 0) {
            configuration = this.entityConfigurations.get(configurationId)
            
            if (configuration === undefined) {
                throw Error('Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.')
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
