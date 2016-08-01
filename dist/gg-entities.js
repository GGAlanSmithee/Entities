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
                        } });
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

            const componentId = this.componentManager.registerComponent(component);

            this.componentLookup.set(name, componentId);

            for (let entity of this.entities) {
                entity[componentId] = this.componentManager.newComponent(componentId);
                Object.defineProperty(entity, name, { get() {
                        return this[componentId];
                    } });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cCAgICAgID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aCA6IHRoaXMuY2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSlcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfX0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50cykgfHwgY29tcG9uZW50cyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgIC8vIERvZXMgbm90IGFsbG93IGNvbXBvbmVudHMgdG8gYmUgYW55dGhpbmcgb3RoZXIgdGhhbiBhIGJpdG1hc2sgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwLnNldChuYW1lLCBjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIG5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfX0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpbml0aWFsaXplclxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50IH07IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZFxuICAgIH1cbiAgICBcbiAgICBhZGRDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gdGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gY29tcG9uZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH50aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50ICAgXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShzeXN0ZW1JZClcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBvblJlbmRlcihvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkluaXQob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudCh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb25JZCkge1xuICAgICAgICBsZXQgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZFxuICAgICAgICBcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29uZmlndXJhdGlvbklkKSAmJiBjb25maWd1cmF0aW9uSWQgPiAwKSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5nZXQoY29uZmlndXJhdGlvbklkKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGVudGl0eSBjb25maWd1cmF0aW9uLiBJZiB5b3Ugd2lzaCB0byBjcmVhdGUgZW50aXRpZXMgd2l0aG91dCBhIGNvbmZpZ3VyYXRpb24sIGRvIG5vdCBwYXNzIGEgY29uZmlndXJhdGlvbklkLicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxuICAgIH1cbiAgICBcbiAgICAvLyBFdmVudCBIYW5kbGVyXG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBRUEsTUFBTSxhQUFOLENBQW9CO0FBQ2hCLElBQUEsa0JBQWM7QUFDVixJQUFBLGFBQUssWUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7QUFDQSxJQUFBLGFBQUssYUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7QUFDSCxJQUFBOztBQUVELElBQUEsd0JBQW9CLEVBQXBCLEVBQXdCLFdBQXhCLEVBQXFDO0FBQ2pDLElBQUEsWUFBSSxDQUFDLE9BQU8sU0FBUCxDQUFpQixFQUFqQixDQUFELElBQXlCLE1BQU0sQ0FBbkMsRUFBc0M7QUFDbEMsSUFBQSxrQkFBTSxVQUFVLGdDQUFWLENBQU47QUFDSCxJQUFBOztBQUVELElBQUEsWUFBSSxPQUFPLFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7QUFDbkMsSUFBQSxrQkFBTSxVQUFVLGlDQUFWLENBQU47QUFDSCxJQUFBOztBQUVELElBQUEsYUFBSyxZQUFMLENBQWtCLEdBQWxCLENBQXNCLEVBQXRCLEVBQTBCLFdBQTFCO0FBQ0gsSUFBQTs7QUFFRCxJQUFBLFlBQVE7QUFDSixJQUFBLGFBQUssYUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7O0FBRUEsSUFBQSxlQUFPLElBQVA7QUFDSCxJQUFBOztBQUVELElBQUEsa0JBQWMsV0FBZCxFQUEyQixXQUEzQixFQUF3QztBQUNwQyxJQUFBLFlBQUksQ0FBQyxPQUFPLFNBQVAsQ0FBaUIsV0FBakIsQ0FBRCxJQUFrQyxlQUFlLENB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
