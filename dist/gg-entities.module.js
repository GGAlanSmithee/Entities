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

/**
 * This function adds one to its input.
 * @param {number} input any number
 * @returns {number} that number, plus one.
 */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXG5cbmNsYXNzIEVudGl0eUZhY3Rvcnkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVycyAgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihpZCkgfHwgaWQgPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdpZCBtdXN0IGJlIGEgcG9zZXRpdmUgaW50ZWdlci4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50SWQpIHx8IGNvbXBvbmVudElkIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoIShlbnRpdHlNYW5hZ2VyIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIGlmIChjb25maWd1cmF0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxuICAgICAgICBcbiAgICAgICAgbGV0IGVudGl0aWVzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgbGV0IHsgaWQsIGVudGl0eSB9ID0gZW50aXR5TWFuYWdlci5uZXdFbnRpdHkoY29tcG9uZW50cylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlkID49IGVudGl0eU1hbmFnZXIuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGxldCBbY29tcG9uZW50LCBpbml0aWFsaXplcl0gb2YgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbGl6ZXIuY2FsbChlbnRpdHlbY29tcG9uZW50XSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50XSA9IHJlc3VsdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW50aXRpZXMucHVzaCh7IGlkLCBlbnRpdHkgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLmxlbmd0aCA9PT0gMSA/IGVudGl0aWVzWzBdIDogZW50aXRpZXNcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxuIiwiLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGFkZHMgb25lIHRvIGl0cyBpbnB1dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBpbnB1dCBhbnkgbnVtYmVyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB0aGF0IG51bWJlciwgcGx1cyBvbmUuXG4gKi9cbmNsYXNzIENvbXBvbmVudE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbmV3Q29tcG9uZW50KGNvbXBvbmVudElkKSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvbXBvbmVudCA9PT0gbnVsbCB8fCBjb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjb21wb25lbnQoKVxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgoY29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29tcG9uZW50KS5mb3JFYWNoKGtleSA9PiByZXRba2V5XSA9IGNvbXBvbmVudFtrZXldKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxuICAgICAgICAgICAgICAgIH0pKGNvbXBvbmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgbWF4ID0gTWF0aC5tYXgoLi4udGhpcy5jb21wb25lbnRzLmtleXMoKSlcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGlkID0gbWF4ID09PSB1bmRlZmluZWQgfHwgbWF4ID09PSBudWxsIHx8IG1heCA9PT0gLUluZmluaXR5ID8gMSA6IG1heCA9PT0gMCA/IDEgOiBtYXggKiAyXG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzLnNldChpZCwgY29tcG9uZW50KVxuXG4gICAgICAgIHJldHVybiBpZFxuICAgIH1cbiAgICBcbiAgICBnZXRDb21wb25lbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRzXG4gICAgfVxufVxuXG5leHBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH1cbiIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xuICAgIExvZ2ljICA6IDAsXG4gICAgUmVuZGVyIDogMSxcbiAgICBJbml0ICAgOiAyXG59XG5cbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5yZW5kZXJTeXN0ZW1zID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMuaW5pdFN5c3RlbXMgICA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigndHlwZSBtdXN0IGJlIGEgdmFsaWQgU3lzdGVtVHlwZS4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudHMgIT09ICdudW1iZXInKSAge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjb21wb25lbnRzIG11c3QgYmUgYSBudW1iZXIuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3Qgc3lzdGVtID0ge1xuICAgICAgICAgICAgY29tcG9uZW50cyxcbiAgICAgICAgICAgIGNhbGxiYWNrXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHN5c3RlbUlkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5sb2dpY1N5c3RlbXMua2V5cygpLCAuLi50aGlzLnJlbmRlclN5c3RlbXMua2V5cygpLCAuLi50aGlzLmluaXRTeXN0ZW1zLmtleXMoKSkgKyAxXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5Mb2dpYyA6IHRoaXMubG9naWNTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5SZW5kZXIgOiB0aGlzLnJlbmRlclN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLkluaXQgOiB0aGlzLmluaXRTeXN0ZW1zLnNldChzeXN0ZW1JZCwgc3lzdGVtKTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN5c3RlbUlkXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZVN5c3RlbShzeXN0ZW1JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2dpY1N5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKSB8fCB0aGlzLnJlbmRlclN5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKSB8fCB0aGlzLmluaXRTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZClcbiAgICB9XG59XG5cbmV4cG9ydCB7IFN5c3RlbU1hbmFnZXIgfVxuIiwiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXG5cbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHJlc29sdmUoKVxuICAgIH0pXG59XG5cbmNvbnN0IHByb21pc2UgPSAoY2FsbGJhY2ssIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQpID0+IHtcbiAgICBpZiAodGltZW91dCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0eXBlb2YgY29udGV4dCA9PT0gICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxuICAgICAgICAgICAgfSwgdGltZW91dClcbiAgICAgICAgfSlcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0JyA/IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykgOiBjYWxsYmFjay5hcHBseShjb250ZXh0LCAuLi5hcmdzKSlcbiAgICB9KVxufVxuICAgIFxuY2xhc3MgRXZlbnRIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0KClcbiAgICB9XG4gICAgXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgTWFwKClcbiAgICB9XG4gICAgXG4gICAgbGlzdGVuKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChldmVudCwgbmV3IE1hcCgpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZXZlbnRJZCA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGV2ZW50SWQgPSBNYXRoLm1heChldmVudElkLCAuLi5ldmVudC5rZXlzKCkpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICArK2V2ZW50SWRcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGV2ZW50SWRcbiAgICB9XG4gICAgXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaWQgb2YgZXZlbnRzLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gZXZlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXG4gICAgICAgIFxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKVxuICAgICAgICBcbiAgICAgICAgbGV0IFsgZXZlbnQgXSA9IGFyZ3Muc3BsaWNlKDAsIDEpXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXJEZWxheWVkKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXG4gICAgICAgIFxuICAgICAgICBsZXQgYXJncyA9IEFycmF5LmZyb20oYXJndW1lbnRzKVxuICAgICAgICBcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhTnVtYmVyLmlzSW50ZWdlcih0aW1lb3V0KSB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIHRpbWVvdXQpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgfVxufVxuXG5leHBvcnQgeyBFdmVudEhhbmRsZXIgfVxuIiwiaW1wb3J0IHsgRW50aXR5RmFjdG9yeSB9ICAgICAgICAgICAgIGZyb20gJy4vZW50aXR5LWZhY3RvcnknXG5pbXBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH0gICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcbmltcG9ydCB7IFN5c3RlbU1hbmFnZXIsIFN5c3RlbVR5cGUgfSBmcm9tICcuL3N5c3RlbS1tYW5hZ2VyJ1xuaW1wb3J0IHsgRXZlbnRIYW5kbGVyIH0gICAgICAgICAgICAgIGZyb20gJy4vZXZlbnQtaGFuZGxlcidcblxuY2xhc3MgRW50aXR5TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAxMDAwKSB7XG4gICAgICAgIHRoaXMuaW5pdChjYXBhY2l0eSlcbiAgICB9XG4gICAgXG4gICAgaW5pdChjYXBhY2l0eSkge1xuICAgICAgICB0aGlzLmNhcGFjaXR5ICAgICAgICAgPSBjYXBhY2l0eVxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAtMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5ICAgID0gbmV3IEVudGl0eUZhY3RvcnkoKVxuICAgICAgICB0aGlzLnN5c3RlbU1hbmFnZXIgICAgPSBuZXcgU3lzdGVtTWFuYWdlcigpXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXIgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXG4gICAgICAgIHRoaXMuY29tcG9uZW50TG9va3VwICAgICAgPSBuZXcgTWFwKClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKVxuICAgIH1cbiAgICBcbiAgICBpbmNyZWFzZUNhcGFjaXR5KCkge1xuICAgICAgICBsZXQgb2xkQ2FwYWNpdHkgPSB0aGlzLmNhcGFjaXR5XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhcGFjaXR5ICo9IDJcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBbLi4udGhpcy5lbnRpdGllcywgLi4uQXJyYXkuZnJvbSh7IGxlbmd0aCA6IG9sZENhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXVxuXG4gICAgICAgIGZvciAobGV0IGkgPSBvbGRDYXBhY2l0eTsgaSA8IHRoaXMuY2FwYWNpdHk7ICsraSkge1xuICAgICAgICAgICAgbGV0IGVudGl0eSA9IHRoaXMuZW50aXRpZXNbaV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRJZCBvZiB0aGlzLmNvbXBvbmVudE1hbmFnZXIuZ2V0Q29tcG9uZW50cygpLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGxldCBjb21wb25lbnROYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiB0aGlzLmNvbXBvbmVudExvb2t1cC5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBjb21wb25lbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZSA9IGtleVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgY29tcG9uZW50TmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBuZXdFbnRpdHkoY29tcG9uZW50cykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRzKSB8fCBjb21wb25lbnRzIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBpZCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IGF1dG8gaW5jcmVhc2UgY2FwYWNpdHk/XG4gICAgICAgICAgICByZXR1cm4geyBpZCA6IHRoaXMuY2FwYWNpdHksIGVudGl0eSA6IG51bGwgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPiB0aGlzLmN1cnJlbnRNYXhFbnRpdHkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgIH1cbiAgICBcbiAgICBkZWxldGVFbnRpdHkoaWQpIHtcbiAgICAgICAgLy90b2RvIGFkZCBzYW5pdHkgY2hlY2tcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IDBcbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSBpZDsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVudGl0aWVzW2ldLmNvbXBvbmVudHMgIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXG4gICAgfVxuXG4gICAgLy8gRG9lcyBub3QgYWxsb3cgY29tcG9uZW50cyB0byBiZSBhbnl0aGluZyBvdGhlciB0aGFuIGEgYml0bWFzayBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgIC8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBzeXN0ZW0gZm9yIGV2ZXJ5IGxvb3AgKHdoaWNoIG1pZ2h0IGJlIGFzIGhpZ2ggYXMgNjAgLyBzZWNvbmQpXG4gICAgKmdldEVudGl0aWVzKGNvbXBvbmVudHMgPSAwKSB7XG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50cyA9PT0gMCB8fCAodGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyAmIGNvbXBvbmVudHMpID09PSBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgeyBpZCwgZW50aXR5IDogdGhpcy5lbnRpdGllc1tpZF0gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbigpIHtcbiAgICAgICAgY29uc3QgY29uZmlndXJhdGlvbklkID0gTWF0aC5tYXgoMCwgLi4udGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5rZXlzKCkpICsgMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlDb25maWd1cmF0aW9ucy5zZXQoY29uZmlndXJhdGlvbklkLCB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlQ29uZmlndXJhdGlvbigpKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb25JZFxuICAgIH1cbiAgICBcbiAgICAvLyBDb21wb25lbnQgTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ25hbWUgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChuYW1lKSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIucmVnaXN0ZXJDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAuc2V0KG5hbWUsIGNvbXBvbmVudElkKVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpIHtcbiAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRJZF0gPSB0aGlzLmNvbXBvbmVudE1hbmFnZXIubmV3Q29tcG9uZW50KGNvbXBvbmVudElkKVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgbmFtZSwgeyBnZXQoKSB7IHJldHVybiB0aGlzW2NvbXBvbmVudElkXSB9LCBjb25maWd1cmFibGU6IHRydWUgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGluaXRpYWxpemVyXG5cbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6IGluaXRpYWxpemVyID0gY29tcG9uZW50OyBicmVha1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0Jzoge1xuICAgICAgICAgICAgICAgIGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjb21wb25lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBjb21wb25lbnRba2V5XVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6IGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb21wb25lbnQgfTsgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudElkXG4gICAgfVxuICAgIFxuICAgIGFkZENvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyB8PSB0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyB8PSBjb21wb25lbnRcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfnRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzICY9IH5jb21wb25lbnQgICBcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBTeXN0ZW0gTWFuYWdlclxuICAgIFxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzID0gQXJyYXkuZnJvbSh0aGlzLmNvbXBvbmVudExvb2t1cCkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBbJycsIGN1cnJbMV0gfCBuZXh0WzFdXSwgWycnLCAwXSlbMV1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJMb2dpY1N5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkxvZ2ljLCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJSZW5kZXJTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5SZW5kZXIsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckluaXRTeXN0ZW0oY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Jbml0LCBjb21wb25lbnRzLCBjYWxsYmFjaylcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbU1hbmFnZXIucmVtb3ZlU3lzdGVtKHN5c3RlbUlkKVxuICAgIH1cbiAgICBcbiAgICBvbkxvZ2ljKG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5sb2dpY1N5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG9uUmVuZGVyKG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5yZW5kZXJTeXN0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uSW5pdChvcHRzKSB7XG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIuaW5pdFN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEVudGl0eSBGYWN0b3J5XG4gICAgXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50LCBpbml0aWFsaXplcilcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIHdpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZShjb3VudCwgY29uZmlndXJhdGlvbklkKSB7XG4gICAgICAgIGxldCBjb25maWd1cmF0aW9uID0gdW5kZWZpbmVkXG4gICAgICAgIFxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb25maWd1cmF0aW9uSWQpICYmIGNvbmZpZ3VyYXRpb25JZCA+IDApIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmdldChjb25maWd1cmF0aW9uSWQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignQ291bGQgbm90IGZpbmQgZW50aXR5IGNvbmZpZ3VyYXRpb24uIElmIHlvdSB3aXNoIHRvIGNyZWF0ZSBlbnRpdGllcyB3aXRob3V0IGEgY29uZmlndXJhdGlvbiwgZG8gbm90IHBhc3MgYSBjb25maWd1cmF0aW9uSWQuJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGUodGhpcywgY291bnQsIGNvbmZpZ3VyYXRpb24pXG4gICAgfVxuICAgIFxuICAgIC8vIEV2ZW50IEhhbmRsZXJcbiAgICBcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci5saXN0ZW4oZXZlbnQsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnN0b3BMaXN0ZW4oZXZlbnRJZClcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXIuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXJEZWxheWVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlckRlbGF5ZWQuY2FsbCh0aGlzLCAuLi5hcmd1bWVudHMpXG4gICAgfVxufVxuXG5leHBvcnQgeyBFbnRpdHlNYW5hZ2VyIH1cbiJdLCJuYW1lcyI6WyJFbnRpdHlGYWN0b3J5IiwiaW5pdCIsImluaXRpYWxpemVycyIsIk1hcCIsImNvbmZpZ3VyYXRpb24iLCJpZCIsImluaXRpYWxpemVyIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwiVHlwZUVycm9yIiwic2V0IiwiY29tcG9uZW50SWQiLCJnZXQiLCJlbnRpdHlNYW5hZ2VyIiwiY291bnQiLCJ1bmRlZmluZWQiLCJFbnRpdHlNYW5hZ2VyIiwiY29tcG9uZW50cyIsIkFycmF5IiwiZnJvbSIsImtleXMiLCJyZWR1Y2UiLCJjdXJyIiwibmV4dCIsImVudGl0aWVzIiwiaSIsImVudGl0eSIsIm5ld0VudGl0eSIsImNhcGFjaXR5IiwiY29tcG9uZW50IiwicmVzdWx0IiwiY2FsbCIsInB1c2giLCJsZW5ndGgiLCJDb21wb25lbnRNYW5hZ2VyIiwicmV0IiwiZm9yRWFjaCIsImtleSIsIm1heCIsIk1hdGgiLCJJbmZpbml0eSIsIlN5c3RlbVR5cGUiLCJTeXN0ZW1NYW5hZ2VyIiwibG9naWNTeXN0ZW1zIiwicmVuZGVyU3lzdGVtcyIsImluaXRTeXN0ZW1zIiwidHlwZSIsImNhbGxiYWNrIiwiTG9naWMiLCJSZW5kZXIiLCJJbml0Iiwic3lzdGVtIiwic3lzdGVtSWQiLCJkZWxldGUiLCJlbXB0eVByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInByb21pc2UiLCJjb250ZXh0IiwiYXJncyIsInRpbWVvdXQiLCJhcHBseSIsIkV2ZW50SGFuZGxlciIsImV2ZW50cyIsImV2ZW50IiwiaGFzIiwiZXZlbnRJZCIsInZhbHVlcyIsInNlbGYiLCJldmVudEhhbmRsZXIiLCJhcmd1bWVudHMiLCJzcGxpY2UiLCJwcm9taXNlcyIsImFsbCIsImN1cnJlbnRNYXhFbnRpdHkiLCJlbnRpdHlGYWN0b3J5Iiwic3lzdGVtTWFuYWdlciIsImNvbXBvbmVudE1hbmFnZXIiLCJlbnRpdHlDb25maWd1cmF0aW9ucyIsImNvbXBvbmVudExvb2t1cCIsIm9sZENhcGFjaXR5IiwiZ2V0Q29tcG9uZW50cyIsImNvbXBvbmVudE5hbWUiLCJ2YWx1ZSIsImVudHJpZXMiLCJuZXdDb21wb25lbnQiLCJkZWZpbmVQcm9wZXJ0eSIsImNvbmZpZ3VyYWJsZSIsImlzQXJyYXkiLCJnZXRFbnRpdGllcyIsImNvbmZpZ3VyYXRpb25JZCIsImNyZWF0ZUNvbmZpZ3VyYXRpb24iLCJuYW1lIiwicmVnaXN0ZXJDb21wb25lbnQiLCJPYmplY3QiLCJyZWdpc3RlckluaXRpYWxpemVyIiwiZW50aXR5SWQiLCJyZWdpc3RlclN5c3RlbSIsInJlbW92ZVN5c3RlbSIsIm9wdHMiLCJidWlsZCIsIndpdGhDb21wb25lbnQiLCJFcnJvciIsImNyZWF0ZSIsImxpc3RlbiIsInN0b3BMaXN0ZW4iLCJ0cmlnZ2VyIiwidHJpZ2dlckRlbGF5ZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLE1BQU1BLGFBQU4sQ0FBb0I7a0JBQ0Y7YUFDTEMsSUFBTDs7O1dBR0c7YUFDRUMsWUFBTCxHQUFxQixJQUFJQyxHQUFKLEVBQXJCO2FBQ0tDLGFBQUwsR0FBcUIsSUFBSUQsR0FBSixFQUFyQjs7O3dCQUdnQkUsRUFBcEIsRUFBd0JDLFdBQXhCLEVBQXFDO1lBQzdCLENBQUNDLE9BQU9DLFNBQVAsQ0FBaUJILEVBQWpCLENBQUQsSUFBeUJBLE1BQU0sQ0FBbkMsRUFBc0M7a0JBQzVCSSxVQUFVLGdDQUFWLENBQU47OztZQUdBLE9BQU9ILFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7a0JBQzdCRyxVQUFVLGlDQUFWLENBQU47OzthQUdDUCxZQUFMLENBQWtCUSxHQUFsQixDQUFzQkwsRUFBdEIsRUFBMEJDLFdBQTFCOzs7WUFHSTthQUNDRixhQUFMLEdBQXFCLElBQUlELEdBQUosRUFBckI7O2VBRU8sSUFBUDs7O2tCQUdVUSxXQUFkLEVBQTJCTCxXQUEzQixFQUF3QztZQUNoQyxDQUFDQyxPQUFPQyxTQUFQLENBQWlCRyxXQUFqQixDQUFELElBQWtDQSxlQUFlLENBQXJELEVBQXdEO21CQUM3QyxJQUFQOzs7WUFHQSxPQUFPTCxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDOzBCQUNyQixLQUFLSixZQUFMLENBQWtCVSxHQUFsQixDQUFzQkQsV0FBdEIsQ0FBZDs7O2FBR0NQLGFBQUwsQ0FBbUJNLEdBQW5CLENBQXVCQyxXQUF2QixFQUFvQ0wsV0FBcEM7O2VBRU8sSUFB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
