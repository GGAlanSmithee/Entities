(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, function (exports) { 'use strict';

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

    class ComponentManager {
        constructor() {
            this.components = new Map()
        }
        
        newComponent(componentId) {
            let component = this.components.get(componentId)
            
            if (component === null || component === undefined) {
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
        
        registerComponent(component) {
            if (component === null || component === undefined) {
                throw TypeError('component cannot be null or undefined.')
            }
            
            const max = Math.max(...this.components.keys())
            
            const id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2

            this.components.set(id, component)

            return id
        }
        
        getComponents() {
            return this.components
        }
    }

    const SystemType = {
        Logic  : 0,
        Render : 1,
        Init   : 2
    }

    class SystemManager {
        constructor() {
            this.logicSystems  = new Map()
            this.renderSystems = new Map()
            this.initSystems   = new Map()
        }
        
        registerSystem(type, components, callback) {
            if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
                throw TypeError('type must be a valid SystemType.')
            }
            
            if (typeof components !== 'number')  {
                throw TypeError('components must be a number.')
            }
            
            if (typeof callback !== 'function') {
                throw TypeError('callback must be a function.')
            }
            
            const system = {
                components,
                callback
            }
            
            const systemId = Math.max(0, ...this.logicSystems.keys(), ...this.renderSystems.keys(), ...this.initSystems.keys()) + 1
            
            switch (type) {
                case SystemType.Logic : this.logicSystems.set(systemId, system); break
                case SystemType.Render : this.renderSystems.set(systemId, system); break
                case SystemType.Init : this.initSystems.set(systemId, system); break
            }
            
            return systemId
        }
        
        removeSystem(systemId) {
            return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId) || this.initSystems.delete(systemId)
        }
    }

    const emptyPromise = () => {
        return new Promise(resolve => {
            resolve()
        })
    }

    const promise = (callback, context, args, timeout) => {
        if (timeout) {
            return new Promise(resolve => {
                setTimeout(function(){
                    resolve(typeof context ===  'object' ? callback.call(context, ...args) : callback.apply(context, ...args))
                }, timeout)
            })
        }
        
        return new Promise(resolve => {
            resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args))
        })
    }
        
    class EventHandler {
        constructor() {
            this.events = new Map()
        }
        
        listen(event, callback) {
            if (typeof event !== 'string' || typeof callback !== 'function') {
                return
            }
            
            if (!this.events.has(event)) {
                this.events.set(event, new Map())
            }
            
            let eventId = -1
            
            this.events.forEach(event => {
                eventId = Math.max(eventId, ...event.keys())
            });
            
            ++eventId
            
            this.events.get(event).set(eventId, callback)
            
            return eventId
        }
        
        stopListen(eventId) {
            for (let events of this.events.values()) {
                for (let id of events.keys()) {
                    if (id === eventId) {
                        return events.delete(eventId)
                    }
                }
            }

            return false
        }
        
        trigger() {
            let self = this instanceof EntityManager ? this.eventHandler : this
            
            let args = Array.from(arguments)
            
            let [ event ] = args.splice(0, 1)
            
            if (typeof event !== 'string' || !self.events.has(event)) {
                return emptyPromise()
            }
            
            let promises = []
            
            for (let callback of self.events.get(event).values()) {
                promises.push(promise(callback, this, args))
            }
            
            return Promise.all(promises)
        }
        
        triggerDelayed() {
            let self = this instanceof EntityManager ? this.eventHandler : this
            
            let args = Array.from(arguments)
            
            let [ event, timeout ] = args.splice(0, 2)
            
            if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
                return emptyPromise()
            }
            
            let promises = []
            
            for (let callback of self.events.get(event).values()) {
                promises.push(promise(callback, this, args, timeout))
            }
            
            return Promise.all(promises)
        }
    }

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

    exports.EntityManager = EntityManager;
    exports.EntityFactory = EntityFactory;
    exports.SystemManager = SystemManager;
    exports.SystemType = SystemType;
    exports.ComponentManager = ComponentManager;
    exports.EventHandler = EventHandler;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFsuLi50aGlzLmVudGl0aWVzLCAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoIDogb2xkQ2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSldXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudGl0aWVzW2ldW2NvbXBvbmVudF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50cykgfHwgY29tcG9uZW50cyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpIHtcbiAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29tcG9uZW50SWRcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnRJZCkge1xuICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudElkXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50SWQpIHtcbiAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50SWRcbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5SZW5kZXIsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXG4gICAgfVxuICAgIFxuICAgIG9uTG9naWMob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Jbml0KG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxuIl0sIm5hbWVz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
