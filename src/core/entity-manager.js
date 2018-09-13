import { containsAll }               from '../util/contains-all'
import { validateAndThrow }          from '../validate'
import { isArray }                   from '../validate/is-array'
import { isNonEmptyString }          from '../validate/is-non-empty-string'
import { isPositiveInteger }         from '../validate/is-positive-integer'
import { isDefined }                 from '../validate/is-defined'
import { contains }                  from '../validate/contains'
import { EntityFactory }             from './entity-factory'
import { ComponentManager }          from './component-manager'
import { SystemManager, SystemType } from './system-manager'
import { EventHandler }              from './event-handler'

class EntityManager {
    constructor(capacity = 1000) {        
        this._entityFactory    = new EntityFactory()
        this._systemManager    = new SystemManager()
        this._componentManager = new ComponentManager()
        this._eventHandler     = new EventHandler()
        
        this._entityConfigurations = new Map()
        
        this._entities = Array.from({ length: capacity, }, (_e, id) => ({ id, components: [] }))
    }

    get capacity() { return this._entities.length }
    get entityFactory() { return this._entityFactory }
    get systemManager() { return this._systemManager }
    get componentManager() { return this._componentManager }
    get eventHandler() { return this._eventHandler }
    get entityConfigurations() { return this._entityConfigurations }
    get entities() { return this._entities }

    increaseCapacity() {
        let oldlength = this._entities.length
        
        this._entities = [
            ...this._entities,
            ...Array.from({ length : oldlength }, (_e, i) => {
                const entity = { 
                    id: oldlength + i,
                    components: [],
                }

                for (const componentName of this._componentManager.components.keys()) {
                    entity[componentName] = this._componentManager.newComponent(componentName)
                }

                return entity
            }),
        ]
    }
    
    newEntity(components) {
        if (!isArray(components)) {
            return null
        }

        // todo: if re-using an old entity, we should reset components

        for (const entity of this._entities) {
            if (entity.components.length === 0) {
                entity.components = components

                this._systemManager.addEntity(entity.id, components)

                return entity
            }
        }
        
        return null
    }
    
    deleteEntity(id) {
        if (!isPositiveInteger(id)) {
            return
        }

        this._systemManager.removeEntity(id)
        
        this._entities[id].components = []
    }

    getEntity(id) {
        if (!isPositiveInteger(id)) {
            return null
        }

        return this._entities[id] || null
    }

    hasComponent(id, component) {
        if (!isNonEmptyString(component)) {
            return false
        }

        const entity = this.getEntity(id)

        if (!entity) {
            return false
        }

        return entity.components.includes(component)
    }

    *getEntitiesByComponents(components = []) {
        if (components.length === 0) {
            for (const entity of this._entities) {
                yield entity
            }

            return
        }

        for (const entity of this._entities.filter(e => containsAll(e.components, components))) {
            yield entity
        }
    }

    *getEntitiesByIds(ids = []) {
        if (!isArray(ids)) {
            return
        }

        for (const id of ids) {
            if (isPositiveInteger(id) && id < this._entities.length) {
                yield this._entities[id]
            }
        }
    }
    
    registerConfiguration(key) {
        validateAndThrow(
            TypeError,
            isNonEmptyString(key, 'key')
        )

        if (contains(this._entityConfigurations, key)) {
            // eslint-disable-next-line no-console
            console.warn(`overwriting entity configuration with key ${key}`)
        }
        
        const configuration = this._entityFactory.createConfiguration()

        this._entityConfigurations.set(key, configuration)
    }
    
    // Component Manager
    
    registerComponent(key, component) {
        // Will be validated in _componentManager.registerComponent
        this._componentManager.registerComponent(key, component)
        
        for (const entity of this._entities) {
            entity[key] = this._componentManager.newComponent(key)
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
        
        this._entityFactory.registerInitializer(key, initializer)
    }
    
    addComponent(entityId, component) {
        if (!isNonEmptyString(component)) {
            return
        }

        if (!this._entities[entityId].components.includes(component)) {
            this._entities[entityId].components.push(component)
        }
    }
    
    removeComponent(entityId, component) {
        this._entities[entityId].components = this._entities[entityId].components.filter(c => c !== component)
    }
    
    // System Manager
    
    registerSystem(type, key, components, callback) {
        this._systemManager.registerSystem(
            type,
            key,
            components,
            Array.from(this.getEntitiesByComponents(components)).map(e => e.id),
            callback)
    }
    
    registerLogicSystem(key, components, callback) {
        this.registerSystem(SystemType.Logic, key, components, callback)
    }
    
    registerRenderSystem(key, components, callback) {
        this.registerSystem(SystemType.Render, key, components, callback)
    }
    
    registerInitSystem(key, components, callback) {
        this.registerSystem(SystemType.Init, key, components, callback)
    }
    
    removeSystem(key) {
        return this._systemManager.removeSystem(key)
    }
    
    onLogic(opts = {}) {
        for (const system of this._systemManager.logicSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }
    
    onRender(opts = {}) {
        for (const system of this._systemManager.renderSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }

    onInit(opts = {}) {
        for (const system of this._systemManager.initSystems.values()) {
            system.callback.call(this, this.getEntitiesByIds(system.entities), opts)
        }
    }
    
    // Entity Factory
    
    registerInitializer(component, initializer) {
        this._entityFactory.registerInitializer(component, initializer)
    }
    
    build() {
        this._entityFactory.build()
        
        return this
    }
    
    withComponent(component, initializer) {
        this._entityFactory.withComponent(component, initializer)
        
        return this
    }
    
    create(count, configurationKey) {
        let configuration = undefined
        
        if (isNonEmptyString(configurationKey)) {
            configuration = this._entityConfigurations.get(configurationKey)
            
            if (!isDefined(configuration)) {
                throw Error('Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationKey.')
            }
        }

        if (isDefined(configurationKey) && !isNonEmptyString(configurationKey)) {
            throw Error('configurationKey should be a string if using a saved configuration, or undefined if not.')
        }
        
        return this._entityFactory.create(this, count, configuration)
    }
    
    // Event Handler
    
    listen(event, callback) {
        return this._eventHandler.listen(event, callback)
    }
    
    stopListen(eventId) {
        return this._eventHandler.stopListen(eventId)
    }
    
    trigger(event, opts = {}) {
        return this._eventHandler.trigger.call(this, event, opts)
    }
    
    triggerDelayed(event, timeout, opts = {}) {
        return this._eventHandler.triggerDelayed.call(this, event, timeout, opts)
    }
}

export { EntityManager }
