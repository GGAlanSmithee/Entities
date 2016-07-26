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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihrZXksIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2tleSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoa2V5LCBpbml0aWFsaXplcilcbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChrZXksIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbml0aWFsaXplciA9IHRoaXMuaW5pdGlhbGl6ZXJzLmdldChrZXkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoa2V5LCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoIShlbnRpdHlNYW5hZ2VyIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uIHx8IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICBcbiAgICAgICAgbGV0IGNvbXBvbmVudHMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIGNvbmZpZ3VyYXRpb24ua2V5cygpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChrZXkpIHtcbiAgICAgICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50cy5nZXQoa2V5KVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNvbXBvbmVudCgpXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnICA6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJldCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0XG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoa2V5LCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigna2V5IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGtleSwgY29tcG9uZW50KVxuXG4gICAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0oa2V5LCB0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5ID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdrZXkgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudHMgYXJndW1lbnQgbXVzdCBiZSBhbiBhcnJheSBvZiBjb21wb25lbnRzLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBzeXN0ZW0gPSB7XG4gICAgICAgICAgICBjb21wb25lbnRzLFxuICAgICAgICAgICAgY2FsbGJhY2tcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoa2V5LCBzeXN0ZW0pOyBicmVha1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLlJlbmRlciA6IHRoaXMucmVuZGVyU3lzdGVtcy5zZXQoa2V5LCBzeXN0ZW0pOyBicmVha1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLkluaXQgOiB0aGlzLmluaXRTeXN0ZW1zLnNldChrZXksIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXlcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2dpY1N5c3RlbXMuZGVsZXRlKGtleSkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShrZXkpIHx8IHRoaXMuaW5pdFN5c3RlbXMuZGVsZXRlKGtleSlcbiAgICB9XG59XG5cbmV4cG9ydCB7IFN5c3RlbU1hbmFnZXIgfVxuIiwiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXG5cbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHJlc29sdmUoKVxuICAgIH0pXG59XG5cbmNvbnN0IHByb21pc2UgPSAoY2FsbGJhY2ssIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQpID0+IHtcbiAgICBpZiAodGltZW91dCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxuICAgICAgICAgICAgfSwgdGltZW91dClcbiAgICAgICAgfSlcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICB9KVxufVxuICAgIFxuY2xhc3MgRXZlbnRIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChldmVudCwgbmV3IE1hcCgpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZXZlbnRJZCA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGV2ZW50SWQgPSBNYXRoLm1heChldmVudElkLCAuLi5ldmVudC5rZXlzKCkpXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgKytldmVudElkXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5nZXQoZXZlbnQpLnNldChldmVudElkLCBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBldmVudElkXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICBmb3IgKGxldCBldmVudHMgb2YgdGhpcy5ldmVudHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlkIG9mIGV2ZW50cy5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50cy5kZWxldGUoZXZlbnRJZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlcigpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50IF0gPSBhcmdzLnNwbGljZSgwLCAxKVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbXB0eVByb21pc2UoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xuICAgICAgICBcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcbiAgICAgICAgXG4gICAgICAgIGxldCBbIGV2ZW50LCB0aW1lb3V0IF0gPSBhcmdzLnNwbGljZSgwLCAyKVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbXB0eVByb21pc2UoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcHJvbWlzZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKGNhbGxiYWNrLCB0aGlzLCBhcmdzLCB0aW1lb3V0KSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRXZlbnRIYW5kbGVyIH1cbiIsImltcG9ydCB7IEVudGl0eUZhY3RvcnkgfSAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5J1xuaW1wb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9ICAgICAgICAgIGZyb20gJy4vY29tcG9uZW50LW1hbmFnZXInXG5pbXBvcnQgeyBTeXN0ZW1NYW5hZ2VyLCBTeXN0ZW1UeXBlIH0gZnJvbSAnLi9zeXN0ZW0tbWFuYWdlcidcbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9ICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInXG5cbmNsYXNzIEVudGl0eU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xuICAgICAgICB0aGlzLmNhcGFjaXR5ICAgICAgICAgPSBjYXBhY2l0eVxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5ICAgID0gbmV3IEVudGl0eUZhY3RvcnkoKVxuICAgICAgICB0aGlzLnN5c3RlbU1hbmFnZXIgICAgPSBuZXcgU3lzdGVtTWFuYWdlcigpXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXIgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aCA6IHRoaXMuY2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogWyBdIH0pKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICBpbmNyZWFzZUNhcGFjaXR5KCkge1xuICAgICAgICBsZXQgb2xkQ2FwYWNpdHkgPSB0aGlzLmNhcGFjaXR5XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhcGFjaXR5ICo9IDJcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBbLi4udGhpcy5lbnRpdGllcywgLi4uQXJyYXkuZnJvbSh7IGxlbmd0aCA6IG9sZENhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IFsgXSB9KSldXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVudGl0aWVzW2ldW2NvbXBvbmVudF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBhcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGlkID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yICg7IGlkIDwgdGhpcy5jYXBhY2l0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgIH1cbiAgICBcbiAgICBkZWxldGVFbnRpdHkoaWQpIHtcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IFtdXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IDBcbiAgICB9XG5cbiAgICAqZ2V0RW50aXRpZXMoY29tcG9uZW50cyA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaWQgPSAwOyBpZCA8PSB0aGlzLmN1cnJlbnRNYXhFbnRpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSBudWxsIHx8IGNvbXBvbmVudHMuZXZlcnkoY29tcG9uZW50ID0+IHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpICE9PSAtMSkpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGtleSkge1xuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5ID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdrZXkgbXVzdCBiZSBhIG5vbiBlbXB0eSBzdHJpbmcuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5zZXQoa2V5LCB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlQ29uZmlndXJhdGlvbigpKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleVxuICAgIH1cbiAgICBcbiAgICAvLyBDb21wb25lbnQgTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGtleSwgY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChrZXksIGNvbXBvbmVudClcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlba2V5XSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoa2V5KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihrZXksIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtleVxuICAgIH1cbiAgICBcbiAgICBhZGRDb21wb25lbnQoaWQsIGNvbXBvbmVudEtleSkge1xuICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudEtleSkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudEtleSlcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudClcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzLnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbShrZXksIHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCB0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJMb2dpY1N5c3RlbShrZXksIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0oa2V5LCBTeXN0ZW1UeXBlLkxvZ2ljLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJSZW5kZXJTeXN0ZW0oa2V5LCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgU3lzdGVtVHlwZS5SZW5kZXIsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRTeXN0ZW0oa2V5LCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKGtleSwgU3lzdGVtVHlwZS5Jbml0LCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShrZXkpXG4gICAgfVxuICAgIFxuICAgIG9uTG9naWMob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Jbml0KG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBrZXkpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGtleSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY291bGQgbm90IGZpbmQgZW50aXR5IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBzdXBwbGllZCBrZXkuIGlmIHlvdSB3aXNoIHRvIGNyZWF0ZSBhbiBlbnRpdHkgd2l0aG91dCBhIGNvbmZpZ3VyYXRpb24sIGRvIG5vdCBwYXNzIGEga2V5LicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxuICAgIH1cbiAgICBcbiAgICAvLyBFdmVudCBIYW5kbGVyXG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBRUEsTUFBTSxhQUFhLENBQUM7QUFDcEIsSUFBQSxJQUFJLFdBQVcsR0FBRztBQUNsQixJQUFBLFFBQVEsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUN0QyxJQUFBLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUN0QyxJQUFBLEtBQUs7QUFDTCxJQUFBO0FBQ0EsSUFBQSxJQUFJLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUU7QUFDMUMsSUFBQSxRQUFRLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxFQUFFLEVBQUU7QUFDbkQsSUFBQSxZQUFZLE1BQU0sU0FBUyxDQUFDLGlDQUFpQyxDQUFDO0FBQzlELElBQUEsU0FBUztBQUNULElBQUE7QUFDQSxJQUFBLFFBQVEsSUFBSSxPQUFPLFdBQVcsS0FBSyxVQUFVLEVBQUU7QUFDL0MsSUFBQSxZQUFZLE1BQU0sU0FBUyxDQUFDLGlDQUFpQyxDQUFDO0FBQzlELElBQUEsU0FBUztBQUNULElBQUE7QUFDQSxJQUFBLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQztBQUMvQyxJQUFBLEtBQUs7QUFDTCxJQUFBO0FBQ0EsSUFBQSxJQUFJLEtBQUssR0FBRztBQUNaLElBQUEsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFO0FBQ3RDLElBQUE7QUFDQSxJQUFBLFFBQVEsT0FBTyxJQUFJO0FBQ25CLElBQUEsS0FBSztBQUNMLElBQUE7QUFDQSxJQUFBLElBQUksYUFBYSxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUU7QUFDcEMsSUFBQSxR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
