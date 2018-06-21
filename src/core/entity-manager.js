import { EntityFactory }             from './entity-factory'
import { ComponentManager }          from './component-manager'
import { SystemManager, SystemType } from './system-manager'
import { EventHandler }              from './event-handler'

class EntityManager {
    constructor(capacity = 1000) {
        this.init(capacity)
    }
    
    init(capacity) {
        this.capacity         = capacity
        this.currentMaxEntity = -1
        
        this.entityFactory    = new EntityFactory()
        this.systemManager    = new SystemManager()
        this.componentManager = new ComponentManager()
        this.eventHandler     = new EventHandler()
        
        this.entityConfigurations = new Map()
        this.componentLookup      = new Map()
        
        this.entities = Array.from({ length : this.capacity }, () => ({ components: 0 }))
    }

    _componentNamesToId(components) {
        return Array
            .from(this.componentLookup)
            .filter(cl => components.some(c => c === cl[0]))
            .map(cl => cl[1])
            .reduce((curr, next) => curr | next, 0)
    }

    increaseCapacity() {
        let oldCapacity = this.capacity
        
        this.capacity *= 2
        
        this.entities = [...this.entities, ...Array.from({ length : oldCapacity }, () => ({ components: 0 }))]

        for (let i = oldCapacity; i < this.capacity; ++i) {
            let entity = this.entities[i]
            
            for (const componentId of this.componentManager.getComponents().keys()) {
                let componentName = null
                
                for (let [key, value] of this.componentLookup.entries()) {
                    if (value === componentId) {
                        componentName = key
                        
                        break
                    }
                }

                entity[componentId] = this.componentManager.newComponent(componentId)
                
                Object.defineProperty(entity, componentName, { get() { return this[componentId] }, configurable: true })
            }
        }
    }
    
    newEntity(components) {
        if (Array.isArray(components)) {
            components = this._componentNamesToId(components)
        }
        
        if (!Number.isInteger(components) || components <= 0) {
            return { id : this.capacity, entity : null }
        }
        
        let id = 0
        
        //todo if re-using an old entity, should we reset components?
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

    getEntity(id) {
        if (!Number.isInteger(id) || id < 0) {
            return undefined
        }

        return this.entities[id]
    }

    hasComponent(id, component) {
        if (typeof component === 'string') {
            component = this._componentNamesToId([ component, ])
        }
        
        if (!Number.isInteger(component) || component <= 0) {
            return false
        }

        const entity = this.getEntity(id)

        if (!entity) {
            return false
        }

        return (entity.components & component) === component
    }

    // Does not allow components to be anything other than a bitmask for performance reasons
    // This method will be called for every system for every loop (which might be as high as 60 / second)
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
    
    registerComponent(name, component) {
        if (typeof name !== 'string' || name.length === 0) {
            throw TypeError('name must be a non-empty string.')
        }
        
        if (this.componentLookup.get(name) != null) {
            return
        }
        
        const componentId = this.componentManager.registerComponent(component)
        
        this.componentLookup.set(name, componentId)
        
        for (let entity of this.entities) {
            entity[componentId] = this.componentManager.newComponent(componentId)
            Object.defineProperty(entity, name, { get() { return this[componentId] }, configurable: true })
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
    
    addComponent(entityId, component) {
        if (typeof component === 'string') {
            this.entities[entityId].components |= this.componentLookup.get(component)
        } else {
            this.entities[entityId].components |= component
        }
    }
    
    removeComponent(entityId, component) {
        if (typeof component === 'string') {
            this.entities[entityId].components &= ~this.componentLookup.get(component)
        } else {
            this.entities[entityId].components &= ~component   
        }
    }
    
    // System Manager
    
    registerSystem(type, components, callback) {
        if (Array.isArray(components)) {
            components = this._componentNamesToId(components)
        }
        
        return this.systemManager.registerSystem(type, components, callback)
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
    
    registerInitializer(component, initializer) {
        if (typeof component === 'string') {
            this.entityFactory.registerInitializer(this.componentLookup.get(component), initializer)
        } else {
            this.entityFactory.registerInitializer(component, initializer)
        }
    }
    
    build() {
        this.entityFactory.build()
        
        return this
    }
    
    withComponent(component, initializer) {
        if (typeof component === 'string') {
            this.entityFactory.withComponent(this.componentLookup.get(component), initializer)
        } else {
            this.entityFactory.withComponent(component, initializer)
        }
        
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
