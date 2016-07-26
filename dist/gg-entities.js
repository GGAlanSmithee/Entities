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

    class ComponentManager {
        constructor() {
            this.components = new Map()
        }
        
        newComponent(key) {
            let component = this.components.get(key)
            
            if (component == null) {
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
        
        registerComponent(key, component) {
            if (typeof key !== 'string' || key === '') {
                throw TypeError('key must be a non-empty string.')
            }
            
            if (component === null || component === undefined) {
                throw TypeError('component cannot be null or undefined.')
            }
            
            this.components.set(key, component)

            return key
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
        
        registerSystem(key, type, components, callback) {
            if (typeof key !== 'string' || key === '') {
                throw TypeError('key must be a non-empty string.')
            }
            
            if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
                throw TypeError('type must be a valid SystemType.')
            }
            
            if (!Array.isArray(components)) {
                throw TypeError('components argument must be an array of components.')
            }
            
            if (typeof callback !== 'function') {
                throw TypeError('callback must be a function.')
            }
            
            let system = {
                components,
                callback
            }
            
            switch (type) {
                case SystemType.Logic : this.logicSystems.set(key, system); break
                case SystemType.Render : this.renderSystems.set(key, system); break
                case SystemType.Init : this.initSystems.set(key, system); break
            }
            
            return key
        }
        
        removeSystem(key) {
            return this.logicSystems.delete(key) || this.renderSystems.delete(key) || this.initSystems.delete(key)
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

    exports.EntityManager = EntityManager;
    exports.EntityFactory = EntityFactory;
    exports.SystemManager = SystemManager;
    exports.SystemType = SystemType;
    exports.ComponentManager = ComponentManager;
    exports.EventHandler = EventHandler;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihrZXksIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoa2V5LCBpbml0aWFsaXplcilcbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChrZXksIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbml0aWFsaXplciA9IHRoaXMuaW5pdGlhbGl6ZXJzLmdldChrZXkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoa2V5LCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoIShlbnRpdHlNYW5hZ2VyIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uIHx8IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICBcbiAgICAgICAgbGV0IGNvbXBvbmVudHMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIGNvbmZpZ3VyYXRpb24ua2V5cygpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9IiwiY2xhc3MgQ29tcG9uZW50TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICBuZXdDb21wb25lbnQoa2V5KSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGtleSlcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjb21wb25lbnQoKVxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29tcG9uZW50KS5mb3JFYWNoKGtleSA9PiByZXRba2V5XSA9IGNvbXBvbmVudFtrZXldKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxuICAgICAgICAgICAgICAgIH0pKGNvbXBvbmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGtleSwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnNldChrZXksIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4ga2V5XG4gICAgfVxuICAgIFxuICAgIGdldENvbXBvbmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xuICAgIExvZ2ljICA6IDAsXG4gICAgUmVuZGVyIDogMSxcbiAgICBJbml0ICAgOiAyXG59XG5cbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5yZW5kZXJTeXN0ZW1zID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMuaW5pdFN5c3RlbXMgICA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclN5c3RlbShrZXksIHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigndHlwZSBtdXN0IGJlIGEgdmFsaWQgU3lzdGVtVHlwZS4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBhcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Mb2dpYyA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KGtleSwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2ljU3lzdGVtcy5kZWxldGUoa2V5KSB8fCB0aGlzLnJlbmRlclN5c3RlbXMuZGVsZXRlKGtleSkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoa2V5KVxuICAgIH1cbn1cblxuZXhwb3J0IHsgU3lzdGVtTWFuYWdlciB9IiwiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXG5cbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHJlc29sdmUoKVxuICAgIH0pXG59XG5cbmNvbnN0IHByb21pc2UgPSAoY2FsbGJhY2ssIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQpID0+IHtcbiAgICBpZiAodGltZW91dCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxuICAgICAgICAgICAgfSwgdGltZW91dClcbiAgICAgICAgfSlcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICB9KVxufVxuICAgIFxuY2xhc3MgRXZlbnRIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChldmVudCwgbmV3IE1hcCgpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZXZlbnRJZCA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGV2ZW50SWQgPSBNYXRoLm1heChldmVudElkLCAuLi5ldmVudC5rZXlzKCkpXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgKytldmVudElkXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5nZXQoZXZlbnQpLnNldChldmVudElkLCBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBldmVudElkXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICBmb3IgKGxldCBldmVudHMgb2YgdGhpcy5ldmVudHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlkIG9mIGV2ZW50cy5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50cy5kZWxldGUoZXZlbnRJZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlcigpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50IF0gPSBhcmdzLnNwbGljZSgwLCAxKVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbXB0eVByb21pc2UoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50LCB0aW1lb3V0IF0gPSBhcmdzLnNwbGljZSgwLCAyKVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbXB0eVByb21pc2UoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzLCB0aW1lb3V0KSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRXZlbnRIYW5kbGVyIH0iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IFsgXSB9KSlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiBbIF0gfSkpXVxuXG4gICAgICAgIGZvciAobGV0IGkgPSBvbGRDYXBhY2l0eTsgaSA8IHRoaXMuY2FwYWNpdHk7ICsraSkge1xuICAgICAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tpXVtjb21wb25lbnRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudHMgYXJndW1lbnQgbXVzdCBiZSBhbiBhcnJheSBvZiBjb21wb25lbnRzLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpZCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBbXVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkIDwgdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaV0uY29tcG9uZW50cy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXG4gICAgfVxuXG4gICAgKmdldEVudGl0aWVzKGNvbXBvbmVudHMgPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50cyA9PT0gbnVsbCB8fCBjb21wb25lbnRzLmV2ZXJ5KGNvbXBvbmVudCA9PiB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KSAhPT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgeyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigna2V5IG11c3QgYmUgYSBub24gZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGtleSwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChrZXksIGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQoa2V5LCBjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgZW50aXR5W2tleV0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGtleSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGluaXRpYWxpemVyXG5cbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVha1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0Jzoge1xuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjb21wb25lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBjb21wb25lbnRba2V5XVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6IGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb21wb25lbnQgfTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoa2V5LCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGlkLCBjb21wb25lbnRLZXkpIHtcbiAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnRLZXkpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRLZXkpXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfVxuICAgIFxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0oa2V5LCB0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgdHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oa2V5LCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGtleSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbShrZXksIFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGtleSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbShrZXksIFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oa2V5KVxuICAgIH1cbiAgICBcbiAgICBvbkxvZ2ljKG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5sb2dpY1N5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG9uUmVuZGVyKG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5yZW5kZXJTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uSW5pdChvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIuaW5pdFN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEVudGl0eSBGYWN0b3J5XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZShjb3VudCwga2V5KSB7XG4gICAgICAgIGxldCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmdldChrZXkpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvdWxkIG5vdCBmaW5kIGVudGl0eSBjb25maWd1cmF0aW9uIGZvciB0aGUgc3VwcGxpZWQga2V5LiBpZiB5b3Ugd2lzaCB0byBjcmVhdGUgYW4gZW50aXR5IHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGtleS4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7SUFFQSxNQUFNLGFBQWEsQ0FBQztBQUNwQixJQUFBLElBQUksV0FBVyxHQUFHO0FBQ2xCLElBQUEsUUFBUSxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ3RDLElBQUEsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFO0FBQ3RDLElBQUEsS0FBSztBQUNMLElBQUE7QUFDQSxJQUFBLElBQUksbUJBQW1CLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRTtBQUMxQyxJQUFBLFFBQVEsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxLQUFLLEVBQUUsRUFBRTtBQUNuRCxJQUFBLFlBQVksTUFBTSxTQUFTLENBQUMsaUNBQWlDLENBQUM7QUFDOUQsSUFBQSxTQUFTO0FBQ1QsSUFBQTtBQUNBLElBQUEsUUFBUSxJQUFJLE9BQU8sV0FBVyxLQUFLLFVBQVUsRUFBRTtBQUMvQyxJQUFBLFlBQVksTUFBTSxTQUFTLENBQUMsaUNBQWlDLENBQUM7QUFDOUQsSUFBQSxTQUFTO0FBQ1QsSUFBQTtBQUNBLElBQUEsUUFBUSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDO0FBQy9DLElBQUEsS0FBSztBQUNMLElBQUE7QUFDQSxJQUFBLElBQUksS0FBSyxHQUFHO0FBQ1osSUFBQSxRQUFRLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDdEMsSUFBQTtBQUNBLElBQUEsUUFBUSxPQUFPLElBQUk7QUFDbkIsSUFBQSxLQUFLO0FBQ0wsSUFBQTtBQUNBLElBQUEsSUFBSSxhQUFhLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRTtBQUNwQyxJQUFBLFFBQVEsSUFBSSxP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
