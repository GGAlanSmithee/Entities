(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, function (exports) { 'use strict';

    class EntityFactory {
        constructor() {
            this.initializers = new Map();
            this.configuration = new Map();
        }

        registerInitializer(id, initializer) {
            if (!Number.isInteger(id) || id <= 0) {
                throw TypeError('id must be a posetive integer.');
            }

            if (typeof initializer !== 'function') {
                throw TypeError('initializer must be a function.');
            }

            this.initializers.set(id, initializer);
        }

        build() {
            this.configuration = new Map();

            return this;
        }

        withComponent(componentId, initializer) {
            if (!Number.isInteger(componentId) || componentId <= 0) {
                return this;
            }

            if (typeof initializer !== 'function') {
                initializer = this.initializers.get(componentId);
            }

            this.configuration.set(componentId, initializer);

            return this;
        }

        createConfiguration() {
            return this.configuration;
        }

        create(entityManager, count = 1, configuration = undefined) {
            if (!(entityManager instanceof EntityManager)) {
                return [];
            }

            if (configuration == null) {
                configuration = this.configuration;
            }

            const components = Array.from(configuration.keys()).reduce((curr, next) => curr |= next, 0);

            let entities = [];

            for (let i = 0; i < count; ++i) {
                let { id, entity } = entityManager.newEntity(components);

                if (id >= entityManager.capacity) {
                    break;
                }

                for (let [component, initializer] of configuration) {
                    if (typeof initializer !== 'function') {
                        continue;
                    }

                    let result = initializer.call(entity[component]);

                    if (typeof entity[component] !== 'object' && result !== undefined) {
                        entity[component] = result;
                    }
                }

                entities.push({ id, entity });
            }

            return entities.length === 1 ? entities[0] : entities;
        }
    }

    class ComponentManager {
        constructor() {
            this.components = new Map();
        }

        newComponent(componentId) {
            let component = this.components.get(componentId);

            if (component === null || component === undefined) {
                return null;
            }

            switch (typeof component) {
                case 'function':
                    return new component();
                case 'object':
                    {
                        return (component => {
                            let ret = {};

                            Object.keys(component).forEach(key => ret[key] = component[key]);

                            return ret;
                        })(component);
                    }
                default:
                    return component;
            }
        }

        registerComponent(component) {
            if (component === null || component === undefined) {
                throw TypeError('component cannot be null or undefined.');
            }

            const max = Math.max(...this.components.keys());

            const id = max === undefined || max === null || max === -Infinity ? 1 : max === 0 ? 1 : max * 2;

            this.components.set(id, component);

            return id;
        }

        getComponents() {
            return this.components;
        }
    }

    const SystemType = {
        Logic: 0,
        Render: 1,
        Init: 2
    };

    class SystemManager {
        constructor() {
            this.logicSystems = new Map();
            this.renderSystems = new Map();
            this.initSystems = new Map();
        }

        registerSystem(type, components, callback) {
            if (type !== SystemType.Logic && type !== SystemType.Render && type !== SystemType.Init) {
                throw TypeError('type must be a valid SystemType.');
            }

            if (typeof components !== 'number') {
                throw TypeError('components must be a number.');
            }

            if (typeof callback !== 'function') {
                throw TypeError('callback must be a function.');
            }

            const system = {
                components,
                callback
            };

            const systemId = Math.max(0, ...this.logicSystems.keys(), ...this.renderSystems.keys(), ...this.initSystems.keys()) + 1;

            switch (type) {
                case SystemType.Logic:
                    this.logicSystems.set(systemId, system);break;
                case SystemType.Render:
                    this.renderSystems.set(systemId, system);break;
                case SystemType.Init:
                    this.initSystems.set(systemId, system);break;
            }

            return systemId;
        }

        removeSystem(systemId) {
            return this.logicSystems.delete(systemId) || this.renderSystems.delete(systemId) || this.initSystems.delete(systemId);
        }
    }

    const emptyPromise = () => {
        return new Promise(resolve => {
            resolve();
        });
    };

    const promise = (callback, context, args, timeout) => {
        if (timeout) {
            return new Promise(resolve => {
                setTimeout(function () {
                    resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
                }, timeout);
            });
        }

        return new Promise(resolve => {
            resolve(typeof context === 'object' ? callback.call(context, ...args) : callback.apply(context, ...args));
        });
    };

    class EventHandler {
        constructor() {
            this.events = new Map();
        }

        listen(event, callback) {
            if (typeof event !== 'string' || typeof callback !== 'function') {
                return;
            }

            if (!this.events.has(event)) {
                this.events.set(event, new Map());
            }

            let eventId = -1;

            this.events.forEach(event => {
                eventId = Math.max(eventId, ...event.keys());
            });

            ++eventId;

            this.events.get(event).set(eventId, callback);

            return eventId;
        }

        stopListen(eventId) {
            for (let events of this.events.values()) {
                for (let id of events.keys()) {
                    if (id === eventId) {
                        return events.delete(eventId);
                    }
                }
            }

            return false;
        }

        trigger() {
            let self = this instanceof EntityManager ? this.eventHandler : this;

            let args = Array.from(arguments);

            let [event] = args.splice(0, 1);

            if (typeof event !== 'string' || !self.events.has(event)) {
                return emptyPromise();
            }

            let promises = [];

            for (let callback of self.events.get(event).values()) {
                promises.push(promise(callback, this, args));
            }

            return Promise.all(promises);
        }

        triggerDelayed() {
            let self = this instanceof EntityManager ? this.eventHandler : this;

            let args = Array.from(arguments);

            let [event, timeout] = args.splice(0, 2);

            if (typeof event !== 'string' || !Number.isInteger(timeout) || !self.events.has(event)) {
                return emptyPromise();
            }

            let promises = [];

            for (let callback of self.events.get(event).values()) {
                promises.push(promise(callback, this, args, timeout));
            }

            return Promise.all(promises);
        }
    }

    class EntityManager {
        constructor(capacity = 1000) {
            this.capacity = capacity;
            this.currentMaxEntity = -1;

            this.entityFactory = new EntityFactory();
            this.systemManager = new SystemManager();
            this.componentManager = new ComponentManager();
            this.eventHandler = new EventHandler();

            this.entityConfigurations = new Map();
            this.componentLookup = new Map();

            this.entities = Array.from({ length: this.capacity }, () => ({ components: 0 }));
        }

        increaseCapacity() {
            let oldCapacity = this.capacity;

            this.capacity *= 2;

            this.entities = [...this.entities, ...Array.from({ length: oldCapacity }, () => ({ components: 0 }))];

            for (let i = oldCapacity; i < this.capacity; ++i) {
                let entity = this.entities[i];

                for (const componentId of this.componentManager.getComponents().keys()) {
                    let componentName = null;

                    for (let [key, value] of this.componentLookup.entries()) {
                        if (value === componentId) {
                            componentName = key;

                            break;
                        }
                    }

                    entity[componentId] = this.componentManager.newComponent(componentId);

                    Object.defineProperty(entity, componentName, { get() {
                            return this[componentId];
                        }, configurable: true });
                }
            }
        }

        newEntity(components) {
            if (Array.isArray(components)) {
                components = Array.from(this.componentLookup).reduce((curr, next) => ['', curr[1] | next[1]], ['', 0])[1];
            }

            if (!Number.isInteger(components) || components <= 0) {
                return { id: this.capacity, entity: null };
            }

            let id = 0;

            for (; id < this.capacity; ++id) {
                if (this.entities[id].components === 0) {
                    break;
                }
            }

            if (id >= this.capacity) {
                // todo: auto increase capacity?
                return { id: this.capacity, entity: null };
            }

            if (id > this.currentMaxEntity) {
                this.currentMaxEntity = id;
            }

            this.entities[id].components = components;

            return { id, entity: this.entities[id] };
        }

        deleteEntity(id) {
            //todo add sanity check
            this.entities[id].components = 0;

            if (id < this.currentMaxEntity) {
                return;
            }

            for (let i = id; i >= 0; --i) {
                if (this.entities[i].components !== 0) {
                    this.currentMaxEntity = i;

                    return;
                }
            }

            this.currentMaxEntity = 0;
        }

        // Does not allow components to be anything other than a bitmask for performance reasons
        // This method will be called for every system for every loop (which might be as high as 60 / second)
        *getEntities(components = 0) {
            for (let id = 0; id <= this.currentMaxEntity; ++id) {
                if (components === 0 || (this.entities[id].components & components) === components) {
                    yield { id, entity: this.entities[id] };
                }
            }
        }

        registerConfiguration() {
            const configurationId = Math.max(0, ...this.entityConfigurations.keys()) + 1;

            this.entityConfigurations.set(configurationId, this.entityFactory.createConfiguration());

            return configurationId;
        }

        // Component Manager

        registerComponent(name, component) {
            if (typeof name !== 'string' || name.length === 0) {
                throw TypeError('name must be a non-empty string.');
            }

            if (this.componentLookup.get(name) != null) {
                console.warn(`component with name ${ name } already registered, aborting`);

                return;
            }

            const componentId = this.componentManager.registerComponent(component);

            this.componentLookup.set(name, componentId);

            for (let entity of this.entities) {
                entity[componentId] = this.componentManager.newComponent(componentId);
                Object.defineProperty(entity, name, { get() {
                        return this[componentId];
                    }, configurable: true });
            }

            let initializer;

            switch (typeof component) {
                case 'function':
                    initializer = component;break;
                case 'object':
                    {
                        initializer = function () {
                            for (let key of Object.keys(component)) {
                                this[key] = component[key];
                            }
                        };

                        break;
                    }
                default:
                    initializer = function () {
                        return component;
                    };break;
            }

            this.entityFactory.registerInitializer(componentId, initializer);

            return componentId;
        }

        addComponent(entityId, component) {
            if (typeof component === 'string') {
                this.entities[entityId].components |= this.componentLookup.get(component);
            } else {
                this.entities[entityId].components |= component;
            }
        }

        removeComponent(entityId, component) {
            if (typeof component === 'string') {
                this.entities[entityId].components &= ~this.componentLookup.get(component);
            } else {
                this.entities[entityId].components &= ~component;
            }
        }

        // System Manager

        registerSystem(type, components, callback) {
            if (Array.isArray(components)) {
                components = Array.from(this.componentLookup).reduce((curr, next) => ['', curr[1] | next[1]], ['', 0])[1];
            }

            return this.systemManager.registerSystem(type, components, callback);
        }

        registerLogicSystem(components, callback) {
            return this.registerSystem(SystemType.Logic, components, callback);
        }

        registerRenderSystem(components, callback) {
            return this.registerSystem(SystemType.Render, components, callback);
        }

        registerInitSystem(components, callback) {
            return this.registerSystem(SystemType.Init, components, callback);
        }

        removeSystem(systemId) {
            return this.systemManager.removeSystem(systemId);
        }

        onLogic(opts) {
            for (let system of this.systemManager.logicSystems.values()) {
                system.callback.call(this, this.getEntities(system.components), opts);
            }
        }

        onRender(opts) {
            for (let system of this.systemManager.renderSystems.values()) {
                system.callback.call(this, this.getEntities(system.components), opts);
            }
        }

        onInit(opts) {
            for (let system of this.systemManager.initSystems.values()) {
                system.callback.call(this, this.getEntities(system.components), opts);
            }
        }

        // Entity Factory

        registerInitializer(component, initializer) {
            if (typeof component === 'string') {
                this.entityFactory.registerInitializer(this.componentLookup.get(component), initializer);
            } else {
                this.entityFactory.registerInitializer(component, initializer);
            }
        }

        build() {
            this.entityFactory.build();

            return this;
        }

        withComponent(component, initializer) {
            if (typeof component === 'string') {
                this.entityFactory.withComponent(this.componentLookup.get(component), initializer);
            } else {
                this.entityFactory.withComponent(component, initializer);
            }

            return this;
        }

        create(count, configurationId) {
            let configuration = undefined;

            if (Number.isInteger(configurationId) && configurationId > 0) {
                configuration = this.entityConfigurations.get(configurationId);

                if (configuration === undefined) {
                    throw Error('Could not find entity configuration. If you wish to create entities without a configuration, do not pass a configurationId.');
                }
            }

            return this.entityFactory.create(this, count, configuration);
        }

        // Event Handler

        listen(event, callback) {
            return this.eventHandler.listen(event, callback);
        }

        stopListen(eventId) {
            return this.eventHandler.stopListen(eventId);
        }

        trigger() {
            return this.eventHandler.trigger.call(this, ...arguments);
        }

        triggerDelayed() {
            return this.eventHandler.triggerDelayed.call(this, ...arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cCAgICAgID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aCA6IHRoaXMuY2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSlcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50cykgfHwgY29tcG9uZW50cyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgIC8vIERvZXMgbm90IGFsbG93IGNvbXBvbmVudHMgdG8gYmUgYW55dGhpbmcgb3RoZXIgdGhhbiBhIGJpdG1hc2sgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQobmFtZSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBjb21wb25lbnQgd2l0aCBuYW1lICR7bmFtZX0gYWxyZWFkeSByZWdpc3RlcmVkLCBhYm9ydGluZ2ApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRJZCA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5zZXQobmFtZSwgY29tcG9uZW50SWQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBuYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29tcG9uZW50SWRcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+dGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfmNvbXBvbmVudCAgIFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXG4gICAgfVxuICAgIFxuICAgIG9uTG9naWMob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Jbml0KG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcih0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQUVBLE1BQU0sYUFBTixDQUFvQjtBQUNoQixJQUFBLGtCQUFjO0FBQ1YsSUFBQSxhQUFLLFlBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCO0FBQ0EsSUFBQSxhQUFLLGFBQUwsR0FBcUIsSUFBSSxHQUFKLEVBQXJCO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLHdCQUFvQixFQUFwQixFQUF3QixXQUF4QixFQUFxQztBQUNqQyxJQUFBLFlBQUksQ0FBQyxPQUFPLFNBQVAsQ0FBaUIsRUFBakIsQ0FBRCxJQUF5QixNQUFNLENBQW5DLEVBQXNDO0FBQ2xDLElBQUEsa0JBQU0sVUFBVSxnQ0FBVixDQUFOO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLFlBQUksT0FBTyxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDO0FBQ25DLElBQUEsa0JBQU0sVUFBVSxpQ0FBVixDQUFOO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLGFBQUssWUFB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
