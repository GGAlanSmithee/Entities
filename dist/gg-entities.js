(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('GGEntities', ['exports'], factory) :
    (factory((global.GGEntities = global.GGEntities || {})));
}(this, (function (exports) { 'use strict';

class EntityFactory {
    constructor() {
        this.init();
    }

    init() {
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
        this.init();
    }

    init() {
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
        this.init();
    }

    init() {
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
        this.init();
    }

    init() {
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
        this.init(capacity);
    }

    init(capacity) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2VudGl0eS1mYWN0b3J5LmpzIiwiLi4vc3JjL2NvcmUvY29tcG9uZW50LW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9zeXN0ZW0tbWFuYWdlci5qcyIsIi4uL3NyYy9jb3JlL2V2ZW50LWhhbmRsZXIuanMiLCIuLi9zcmMvY29yZS9lbnRpdHktbWFuYWdlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY2xhc3MgRW50aXR5RmFjdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihpZCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2lkIG11c3QgYmUgYSBwb3NldGl2ZSBpbnRlZ2VyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaW5pdGlhbGl6ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZXJzLnNldChpZCwgaW5pdGlhbGl6ZXIpXG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSB0aGlzLmluaXRpYWxpemVycy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbi5zZXQoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvblxuICAgIH1cbiAgICBcbiAgICBjcmVhdGUoZW50aXR5TWFuYWdlciwgY291bnQgPSAxLCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuY29uZmlndXJhdGlvblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gQXJyYXkuZnJvbShjb25maWd1cmF0aW9uLmtleXMoKSkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHw9IG5leHQsIDApXG4gICAgICAgIFxuICAgICAgICBsZXQgZW50aXRpZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgICAgICAgICBsZXQgeyBpZCwgZW50aXR5IH0gPSBlbnRpdHlNYW5hZ2VyLm5ld0VudGl0eShjb21wb25lbnRzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAobGV0IFtjb21wb25lbnQsIGluaXRpYWxpemVyXSBvZiBjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW50aXR5W2NvbXBvbmVudF0gIT09ICdvYmplY3QnICYmIHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbnRpdGllcy5wdXNoKHsgaWQsIGVudGl0eSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZW50aXRpZXMubGVuZ3RoID09PSAxID8gZW50aXRpZXNbMF0gOiBlbnRpdGllc1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRW50aXR5RmFjdG9yeSB9XG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0KClcbiAgICB9XG4gICAgXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xuICAgICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzLmdldChjb21wb25lbnRJZClcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIGNvbXBvbmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCcgIDoge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGNvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbXBvbmVudCkuZm9yRWFjaChrZXkgPT4gcmV0W2tleV0gPSBjb21wb25lbnRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgICAgICAgICB9KShjb21wb25lbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnQgY2Fubm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLnRoaXMuY29tcG9uZW50cy5rZXlzKCkpXG4gICAgICAgIFxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gdW5kZWZpbmVkIHx8IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IC1JbmZpbml0eSA/IDEgOiBtYXggPT09IDAgPyAxIDogbWF4ICogMlxuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5zZXQoaWQsIGNvbXBvbmVudClcblxuICAgICAgICByZXR1cm4gaWRcbiAgICB9XG4gICAgXG4gICAgZ2V0Q29tcG9uZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50c1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XG4iLCJleHBvcnQgY29uc3QgU3lzdGVtVHlwZSA9IHtcbiAgICBMb2dpYyAgOiAwLFxuICAgIFJlbmRlciA6IDEsXG4gICAgSW5pdCAgIDogMlxufVxuXG5jbGFzcyBTeXN0ZW1NYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0KClcbiAgICB9XG4gICAgXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5sb2dpY1N5c3RlbXMgID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMucmVuZGVyU3lzdGVtcyA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGUgIT09IFN5c3RlbVR5cGUuTG9naWMgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5SZW5kZXIgJiYgdHlwZSAhPT0gU3lzdGVtVHlwZS5Jbml0KSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ3R5cGUgbXVzdCBiZSBhIHZhbGlkIFN5c3RlbVR5cGUuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzICE9PSAnbnVtYmVyJykgIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbSA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMsXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuUmVuZGVyIDogdGhpcy5yZW5kZXJTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Jbml0IDogdGhpcy5pbml0U3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzeXN0ZW1JZFxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXG4gICAgfVxufVxuXG5leHBvcnQgeyBTeXN0ZW1NYW5hZ2VyIH1cbiIsImltcG9ydCB7IEVudGl0eU1hbmFnZXIgfSBmcm9tICcuL2VudGl0eS1tYW5hZ2VyJ1xuXG5jb25zdCBlbXB0eVByb21pc2UgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKClcbiAgICB9KVxufVxuXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgfSlcbn1cbiAgICBcbmNsYXNzIEV2ZW50SGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQoZXZlbnQsIG5ldyBNYXAoKSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgICBldmVudElkID0gTWF0aC5tYXgoZXZlbnRJZCwgLi4uZXZlbnQua2V5cygpKVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5pbml0KGNhcGFjaXR5KVxuICAgIH1cbiAgICBcbiAgICBpbml0KGNhcGFjaXR5KSB7XG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXG4gICAgICAgIHRoaXMuc3lzdGVtTWFuYWdlciAgICA9IG5ldyBTeXN0ZW1NYW5hZ2VyKClcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIoKVxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFsuLi50aGlzLmVudGl0aWVzLCAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoIDogb2xkQ2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSldXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XG4gICAgICAgICAgICBsZXQgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudElkIG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBvbmVudE5hbWUgPSBudWxsXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMuY29tcG9uZW50TG9va3VwLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGNvbXBvbmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lID0ga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBjb21wb25lbnROYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzID0gQXJyYXkuZnJvbSh0aGlzLmNvbXBvbmVudExvb2t1cCkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBbJycsIGN1cnJbMV0gfCBuZXh0WzFdXSwgWycnLCAwXSlbMV1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGNvbXBvbmVudHMpIHx8IGNvbXBvbmVudHMgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGlkID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yICg7IGlkIDwgdGhpcy5jYXBhY2l0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPj0gdGhpcy5jYXBhY2l0eSkge1xuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaWRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IGNvbXBvbmVudHNcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgfVxuICAgIFxuICAgIGRlbGV0ZUVudGl0eShpZCkge1xuICAgICAgICAvL3RvZG8gYWRkIHNhbml0eSBjaGVja1xuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gMFxuICAgICAgICBcbiAgICAgICAgaWYgKGlkIDwgdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaV0uY29tcG9uZW50cyAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IDBcbiAgICB9XG5cbiAgICAvLyBEb2VzIG5vdCBhbGxvdyBjb21wb25lbnRzIHRvIGJlIGFueXRoaW5nIG90aGVyIHRoYW4gYSBiaXRtYXNrIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG4gICAgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHN5c3RlbSBmb3IgZXZlcnkgbG9vcCAod2hpY2ggbWlnaHQgYmUgYXMgaGlnaCBhcyA2MCAvIHNlY29uZClcbiAgICAqZ2V0RW50aXRpZXMoY29tcG9uZW50cyA9IDApIHtcbiAgICAgICAgZm9yIChsZXQgaWQgPSAwOyBpZCA8PSB0aGlzLmN1cnJlbnRNYXhFbnRpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSAwIHx8ICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzICYgY29tcG9uZW50cykgPT09IGNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKCkge1xuICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmtleXMoKSkgKyAxXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLnNldChjb25maWd1cmF0aW9uSWQsIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGVDb25maWd1cmF0aW9uKCkpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbklkXG4gICAgfVxuICAgIFxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQobmFtZSwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KG5hbWUpICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRJZCA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5zZXQobmFtZSwgY29tcG9uZW50SWQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBuYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29tcG9uZW50SWRcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+dGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfmNvbXBvbmVudCAgIFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXG4gICAgfVxuICAgIFxuICAgIG9uTG9naWMob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Jbml0KG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcih0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLE1BQU0sYUFBTixDQUFvQjtrQkFDRjthQUNMLElBQUw7OztXQUdHO2FBQ0UsWUFBTCxHQUFxQixJQUFJLEdBQUosRUFBckI7YUFDSyxhQUFMLEdBQXFCLElBQUksR0FBSixFQUFyQjs7O3dCQUdnQixFQUFwQixFQUF3QixXQUF4QixFQUFxQztZQUM3QixDQUFDLE9BQU8sU0FBUCxDQUFpQixFQUFqQixDQUFELElBQXlCLE1BQU0sQ0FBbkMsRUFBc0M7a0JBQzVCLFVBQVUsZ0NBQVYsQ0FBTjs7O1lBR0EsT0FBTyxX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
