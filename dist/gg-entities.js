(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, (function (exports) { 'use strict';

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

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAgICAgICAgID0gY2FwYWNpdHlcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeSAgICA9IG5ldyBFbnRpdHlGYWN0b3J5KClcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudE1hbmFnZXIgPSBuZXcgQ29tcG9uZW50TWFuYWdlcigpXG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cCAgICAgID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aCA6IHRoaXMuY2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSlcbiAgICB9XG4gICAgXG4gICAgaW5jcmVhc2VDYXBhY2l0eSgpIHtcbiAgICAgICAgbGV0IG9sZENhcGFjaXR5ID0gdGhpcy5jYXBhY2l0eVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXBhY2l0eSAqPSAyXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cblxuICAgICAgICBmb3IgKGxldCBpID0gb2xkQ2FwYWNpdHk7IGkgPCB0aGlzLmNhcGFjaXR5OyArK2kpIHtcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50SWQgb2YgdGhpcy5jb21wb25lbnRNYW5hZ2VyLmdldENvbXBvbmVudHMoKS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jb21wb25lbnRMb29rdXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWUgPSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgbmV3RW50aXR5KGNvbXBvbmVudHMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50cykgfHwgY29tcG9uZW50cyA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaWQgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgKDsgaWQgPCB0aGlzLmNhcGFjaXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyB0b2RvOiBhdXRvIGluY3JlYXNlIGNhcGFjaXR5P1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gY29tcG9uZW50c1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICB9XG4gICAgXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XG4gICAgICAgIC8vdG9kbyBhZGQgc2FuaXR5IGNoZWNrXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSAwXG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPCB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gaWQ7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gMFxuICAgIH1cblxuICAgIC8vIERvZXMgbm90IGFsbG93IGNvbXBvbmVudHMgdG8gYmUgYW55dGhpbmcgb3RoZXIgdGhhbiBhIGJpdG1hc2sgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnNcbiAgICAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgc3lzdGVtIGZvciBldmVyeSBsb29wICh3aGljaCBtaWdodCBiZSBhcyBoaWdoIGFzIDYwIC8gc2Vjb25kKVxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xuICAgICAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDw9IHRoaXMuY3VycmVudE1heEVudGl0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgPT09IDAgfHwgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgJiBjb21wb25lbnRzKSA9PT0gY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuc2V0KGNvbmZpZ3VyYXRpb25JZCwgdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZUNvbmZpZ3VyYXRpb24oKSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWd1cmF0aW9uSWRcbiAgICB9XG4gICAgXG4gICAgLy8gQ29tcG9uZW50IE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCduYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQobmFtZSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwLnNldChuYW1lLCBjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiB0aGlzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIG5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpbml0aWFsaXplclxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXldID0gY29tcG9uZW50W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiBpbml0aWFsaXplciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29tcG9uZW50IH07IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZFxuICAgIH1cbiAgICBcbiAgICBhZGRDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gdGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgfD0gY29tcG9uZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH50aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50ICAgXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gU3lzdGVtIE1hbmFnZXJcbiAgICBcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyTG9naWNTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Mb2dpYywgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyUmVuZGVyU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuSW5pdCwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbW92ZVN5c3RlbShzeXN0ZW1JZClcbiAgICB9XG4gICAgXG4gICAgb25Mb2dpYyhvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBvblJlbmRlcihvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkluaXQob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBFbnRpdHkgRmFjdG9yeVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5idWlsZCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudCh0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3Rvcnkud2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoY291bnQsIGNvbmZpZ3VyYXRpb25JZCkge1xuICAgICAgICBsZXQgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZFxuICAgICAgICBcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29uZmlndXJhdGlvbklkKSAmJiBjb25maWd1cmF0aW9uSWQgPiAwKSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uID0gdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5nZXQoY29uZmlndXJhdGlvbklkKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGVudGl0eSBjb25maWd1cmF0aW9uLiBJZiB5b3Ugd2lzaCB0byBjcmVhdGUgZW50aXRpZXMgd2l0aG91dCBhIGNvbmZpZ3VyYXRpb24sIGRvIG5vdCBwYXNzIGEgY29uZmlndXJhdGlvbklkLicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxuICAgIH1cbiAgICBcbiAgICAvLyBFdmVudCBIYW5kbGVyXG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5zdG9wTGlzdGVuKGV2ZW50SWQpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyRGVsYXllZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5TWFuYWdlciB9XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsTUFBTSxhQUFOLENBQW9CO2tCQUNGO2FBQ0wsWUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7YUFDSyxhQUFMLEdBQXFCLElBQUksR0FBSixFQUFyQjs7O3dCQUdnQixFQUFwQixFQUF3QixXQUF4QixFQUFxQztZQUM3QixDQUFDLE9BQU8sU0FBUCxDQUFpQixFQUFqQixDQUFELElBQXlCLE1BQU0sQ0FBbkMsRUFBc0M7a0JBQzVCLFVBQVUsZ0NBQVYsQ0FBTjs7O1lBR0EsT0FBTyxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDO2tCQUM3QixVQUFVLGlDQUFWLENBQU47OzthQUdDLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBc0IsRUFBdEIsRUFBMEIsV0FBMUI7OztZQUdJO2FBQ0MsYUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7O2VBRU8sSUFBUDs7O2tCQUdVLFdBQWQsRUFBMkIsV0FBM0IsRUFBd0M7WUFDaEMsQ0FBQyxPQUFPLFNBQVAsQ0FBaUIsV0FBakIsQ0FBRCxJQUFrQyxlQUFlLENBQXJELEVBQXdEO21CQUM3QyxJQUFQOzs7WUFHQSxPQUFPLFdBQVAsS0FBdUIsVUFB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
