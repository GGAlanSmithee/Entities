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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXG5cbmNsYXNzIEVudGl0eUZhY3Rvcnkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVycyAgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihpZCkgfHwgaWQgPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdpZCBtdXN0IGJlIGEgcG9zZXRpdmUgaW50ZWdlci4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxuICAgIH1cbiAgICBcbiAgICBidWlsZCgpIHtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgICBcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY29tcG9uZW50SWQpIHx8IGNvbXBvbmVudElkIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoIShlbnRpdHlNYW5hZ2VyIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG4gICAgXG4gICAgICAgIGlmIChjb25maWd1cmF0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxuICAgICAgICBcbiAgICAgICAgbGV0IGVudGl0aWVzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgICAgICAgICAgbGV0IHsgaWQsIGVudGl0eSB9ID0gZW50aXR5TWFuYWdlci5uZXdFbnRpdHkoY29tcG9uZW50cylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlkID49IGVudGl0eU1hbmFnZXIuY2FwYWNpdHkpIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGxldCBbY29tcG9uZW50LCBpbml0aWFsaXplcl0gb2YgY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbGl6ZXIuY2FsbChlbnRpdHlbY29tcG9uZW50XSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50XSA9IHJlc3VsdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW50aXRpZXMucHVzaCh7IGlkLCBlbnRpdHkgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzLmxlbmd0aCA9PT0gMSA/IGVudGl0aWVzWzBdIDogZW50aXRpZXNcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxuIiwiY2xhc3MgQ29tcG9uZW50TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICBuZXdDb21wb25lbnQoY29tcG9uZW50SWQpIHtcbiAgICAgICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50cy5nZXQoY29tcG9uZW50SWQpXG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNvbXBvbmVudCgpXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnICA6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJldCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0XG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKVxuICAgICAgICBcbiAgICAgICAgY29uc3QgaWQgPSBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IG51bGwgfHwgbWF4ID09PSAtSW5maW5pdHkgPyAxIDogbWF4ID09PSAwID8gMSA6IG1heCAqIDJcblxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpXG5cbiAgICAgICAgcmV0dXJuIGlkXG4gICAgfVxuICAgIFxuICAgIGdldENvbXBvbmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfVxuIiwiZXhwb3J0IGNvbnN0IFN5c3RlbVR5cGUgPSB7XG4gICAgTG9naWMgIDogMCxcbiAgICBSZW5kZXIgOiAxLFxuICAgIEluaXQgICA6IDJcbn1cblxuY2xhc3MgU3lzdGVtTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuICAgIFxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMubG9naWNTeXN0ZW1zICA9IG5ldyBNYXAoKVxuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5pbml0U3lzdGVtcyAgID0gbmV3IE1hcCgpXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlICE9PSBTeXN0ZW1UeXBlLkxvZ2ljICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuUmVuZGVyICYmIHR5cGUgIT09IFN5c3RlbVR5cGUuSW5pdCkge1xuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCd0eXBlIG11c3QgYmUgYSB2YWxpZCBTeXN0ZW1UeXBlLicpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50cyAhPT0gJ251bWJlcicpICB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NvbXBvbmVudHMgbXVzdCBiZSBhIG51bWJlci4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2NhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzeXN0ZW0gPSB7XG4gICAgICAgICAgICBjb21wb25lbnRzLFxuICAgICAgICAgICAgY2FsbGJhY2tcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3Qgc3lzdGVtSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmxvZ2ljU3lzdGVtcy5rZXlzKCksIC4uLnRoaXMucmVuZGVyU3lzdGVtcy5rZXlzKCksIC4uLnRoaXMuaW5pdFN5c3RlbXMua2V5cygpKSArIDFcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLkxvZ2ljIDogdGhpcy5sb2dpY1N5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xuICAgICAgICAgICAgY2FzZSBTeXN0ZW1UeXBlLlJlbmRlciA6IHRoaXMucmVuZGVyU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3lzdGVtSWRcbiAgICB9XG4gICAgXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2ljU3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpIHx8IHRoaXMucmVuZGVyU3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpIHx8IHRoaXMuaW5pdFN5c3RlbXMuZGVsZXRlKHN5c3RlbUlkKVxuICAgIH1cbn1cblxuZXhwb3J0IHsgU3lzdGVtTWFuYWdlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcblxuY29uc3QgZW1wdHlQcm9taXNlID0gKCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgfSlcbn1cblxuY29uc3QgcHJvbWlzZSA9IChjYWxsYmFjaywgY29udGV4dCwgYXJncywgdGltZW91dCkgPT4ge1xuICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHR5cGVvZiBjb250ZXh0ID09PSAgJ29iamVjdCcgPyBjYWxsYmFjay5jYWxsKGNvbnRleHQsIC4uLmFyZ3MpIDogY2FsbGJhY2suYXBwbHkoY29udGV4dCwgLi4uYXJncykpXG4gICAgICAgICAgICB9LCB0aW1lb3V0KVxuICAgICAgICB9KVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHJlc29sdmUodHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnID8gY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSA6IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIC4uLmFyZ3MpKVxuICAgIH0pXG59XG4gICAgXG5jbGFzcyBFdmVudEhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBcbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICBcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5ldmVudHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBldmVudElkID0gLTFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgICsrZXZlbnRJZFxuICAgICAgICBcbiAgICAgICAgdGhpcy5ldmVudHMuZ2V0KGV2ZW50KS5zZXQoZXZlbnRJZCwgY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXZlbnRJZFxuICAgIH1cbiAgICBcbiAgICBzdG9wTGlzdGVuKGV2ZW50SWQpIHtcbiAgICAgICAgZm9yIChsZXQgZXZlbnRzIG9mIHRoaXMuZXZlbnRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkID09PSBldmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudHMuZGVsZXRlKGV2ZW50SWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIFxuICAgIHRyaWdnZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcyBpbnN0YW5jZW9mIEVudGl0eU1hbmFnZXIgPyB0aGlzLmV2ZW50SGFuZGxlciA6IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXG4gICAgICAgIFxuICAgICAgICBsZXQgWyBldmVudCwgdGltZW91dCBdID0gYXJncy5zcGxpY2UoMCwgMilcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVvdXQpIHx8ICFzZWxmLmV2ZW50cy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGNhbGxiYWNrIG9mIHNlbGYuZXZlbnRzLmdldChldmVudCkudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncywgdGltZW91dCkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XG4iLCJpbXBvcnQgeyBFbnRpdHlGYWN0b3J5IH0gICAgICAgICAgICAgZnJvbSAnLi9lbnRpdHktZmFjdG9yeSdcbmltcG9ydCB7IENvbXBvbmVudE1hbmFnZXIgfSAgICAgICAgICBmcm9tICcuL2NvbXBvbmVudC1tYW5hZ2VyJ1xuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXG5pbXBvcnQgeyBFdmVudEhhbmRsZXIgfSAgICAgICAgICAgICAgZnJvbSAnLi9ldmVudC1oYW5kbGVyJ1xuXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYXBhY2l0eSA9IDEwMDApIHtcbiAgICAgICAgdGhpcy5pbml0KGNhcGFjaXR5KVxuICAgIH1cbiAgICBcbiAgICBpbml0KGNhcGFjaXR5KSB7XG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IC0xXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXG4gICAgICAgIHRoaXMuc3lzdGVtTWFuYWdlciAgICA9IG5ldyBTeXN0ZW1NYW5hZ2VyKClcbiAgICAgICAgdGhpcy5jb21wb25lbnRNYW5hZ2VyID0gbmV3IENvbXBvbmVudE1hbmFnZXIoKVxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMgPSBuZXcgTWFwKClcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IEFycmF5LmZyb20oeyBsZW5ndGggOiB0aGlzLmNhcGFjaXR5IH0sICgpID0+ICh7IGNvbXBvbmVudHM6IDAgfSkpXG4gICAgfVxuICAgIFxuICAgIGluY3JlYXNlQ2FwYWNpdHkoKSB7XG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgKj0gMlxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFsuLi50aGlzLmVudGl0aWVzLCAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoIDogb2xkQ2FwYWNpdHkgfSwgKCkgPT4gKHsgY29tcG9uZW50czogMCB9KSldXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XG4gICAgICAgICAgICBsZXQgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tpXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudElkIG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBvbmVudE5hbWUgPSBudWxsXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMuY29tcG9uZW50TG9va3VwLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGNvbXBvbmVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lID0ga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBlbnRpdHlbY29tcG9uZW50SWRdID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLm5ld0NvbXBvbmVudChjb21wb25lbnRJZClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBjb21wb25lbnROYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICBjb21wb25lbnRzID0gQXJyYXkuZnJvbSh0aGlzLmNvbXBvbmVudExvb2t1cCkucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBbJycsIGN1cnJbMV0gfCBuZXh0WzFdXSwgWycnLCAwXSlbMV1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGNvbXBvbmVudHMpIHx8IGNvbXBvbmVudHMgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IGlkID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yICg7IGlkIDwgdGhpcy5jYXBhY2l0eTsgKytpZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaWQgPj0gdGhpcy5jYXBhY2l0eSkge1xuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cbiAgICAgICAgICAgIHJldHVybiB7IGlkIDogdGhpcy5jYXBhY2l0eSwgZW50aXR5IDogbnVsbCB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChpZCA+IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gaWRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnRpdGllc1tpZF0uY29tcG9uZW50cyA9IGNvbXBvbmVudHNcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgfVxuICAgIFxuICAgIGRlbGV0ZUVudGl0eShpZCkge1xuICAgICAgICAvL3RvZG8gYWRkIHNhbml0eSBjaGVja1xuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gMFxuICAgICAgICBcbiAgICAgICAgaWYgKGlkIDwgdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaV0uY29tcG9uZW50cyAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IDBcbiAgICB9XG5cbiAgICAvLyBEb2VzIG5vdCBhbGxvdyBjb21wb25lbnRzIHRvIGJlIGFueXRoaW5nIG90aGVyIHRoYW4gYSBiaXRtYXNrIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG4gICAgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHN5c3RlbSBmb3IgZXZlcnkgbG9vcCAod2hpY2ggbWlnaHQgYmUgYXMgaGlnaCBhcyA2MCAvIHNlY29uZClcbiAgICAqZ2V0RW50aXRpZXMoY29tcG9uZW50cyA9IDApIHtcbiAgICAgICAgZm9yIChsZXQgaWQgPSAwOyBpZCA8PSB0aGlzLmN1cnJlbnRNYXhFbnRpdHk7ICsraWQpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSAwIHx8ICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzICYgY29tcG9uZW50cykgPT09IGNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7IGlkLCBlbnRpdHkgOiB0aGlzLmVudGl0aWVzW2lkXSB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKCkge1xuICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uSWQgPSBNYXRoLm1heCgwLCAuLi50aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLmtleXMoKSkgKyAxXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLnNldChjb25maWd1cmF0aW9uSWQsIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGVDb25maWd1cmF0aW9uKCkpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29uZmlndXJhdGlvbklkXG4gICAgfVxuICAgIFxuICAgIC8vIENvbXBvbmVudCBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJDb21wb25lbnQobmFtZSwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgbmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KG5hbWUpICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb21wb25lbnRJZCA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5yZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpXG4gICAgICAgIFxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5zZXQobmFtZSwgY29tcG9uZW50SWQpXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgdGhpcy5lbnRpdGllcykge1xuICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCBuYW1lLCB7IGdldCgpIHsgcmV0dXJuIHRoaXNbY29tcG9uZW50SWRdIH0sIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5pdGlhbGl6ZXJcblxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzogaW5pdGlhbGl6ZXIgPSBjb21wb25lbnQ7IGJyZWFrXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKGNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGNvbXBvbmVudFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDogaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNvbXBvbmVudCB9OyBicmVha1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnRJZCwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29tcG9uZW50SWRcbiAgICB9XG4gICAgXG4gICAgYWRkQ29tcG9uZW50KGVudGl0eUlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IGNvbXBvbmVudFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+dGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfmNvbXBvbmVudCAgIFxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFN5c3RlbSBNYW5hZ2VyXG4gICAgXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheS5mcm9tKHRoaXMuY29tcG9uZW50TG9va3VwKS5yZWR1Y2UoKGN1cnIsIG5leHQpID0+IFsnJywgY3VyclsxXSB8IG5leHRbMV1dLCBbJycsIDBdKVsxXVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlZ2lzdGVyU3lzdGVtKHR5cGUsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlckxvZ2ljU3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLlJlbmRlciwgY29tcG9uZW50cywgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHJlZ2lzdGVySW5pdFN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3RlclN5c3RlbShTeXN0ZW1UeXBlLkluaXQsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxuICAgIH1cbiAgICBcbiAgICByZW1vdmVTeXN0ZW0oc3lzdGVtSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXG4gICAgfVxuICAgIFxuICAgIG9uTG9naWMob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmxvZ2ljU3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb25SZW5kZXIob3B0cykge1xuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLnJlbmRlclN5c3RlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Jbml0KG9wdHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3lzdGVtIG9mIHRoaXMuc3lzdGVtTWFuYWdlci5pbml0U3lzdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgc3lzdGVtLmNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXRFbnRpdGllcyhzeXN0ZW0uY29tcG9uZW50cyksIG9wdHMpXG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcbiAgICBcbiAgICByZWdpc3RlckluaXRpYWxpemVyKGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcih0aGlzLmNvbXBvbmVudExvb2t1cC5nZXQoY29tcG9uZW50KSwgaW5pdGlhbGl6ZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkuYnVpbGQoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgd2l0aENvbXBvbmVudChjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQoY29tcG9uZW50LCBpbml0aWFsaXplcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNvdW50LCBjb25maWd1cmF0aW9uSWQpIHtcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcbiAgICAgICAgXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbmZpZ3VyYXRpb25JZCkgJiYgY29uZmlndXJhdGlvbklkID4gMCkge1xuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5lbnRpdHlGYWN0b3J5LmNyZWF0ZSh0aGlzLCBjb3VudCwgY29uZmlndXJhdGlvbilcbiAgICB9XG4gICAgXG4gICAgLy8gRXZlbnQgSGFuZGxlclxuICAgIFxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLmxpc3RlbihldmVudCwgY2FsbGJhY2spXG4gICAgfVxuICAgIFxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIuc3RvcExpc3RlbihldmVudElkKVxuICAgIH1cbiAgICBcbiAgICB0cmlnZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG4gICAgXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50SGFuZGxlci50cmlnZ2VyRGVsYXllZC5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVudGl0eU1hbmFnZXIgfVxuIl0sIm5hbWVzIjpbIkVudGl0eUZhY3RvcnkiLCJpbml0IiwiaW5pdGlhbGl6ZXJzIiwiTWFwIiwiY29uZmlndXJhdGlvbiIsImlkIiwiaW5pdGlhbGl6ZXIiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJUeXBlRXJyb3IiLCJzZXQiLCJjb21wb25lbnRJZCIsImdldCIsImVudGl0eU1hbmFnZXIiLCJjb3VudCIsInVuZGVmaW5lZCIsIkVudGl0eU1hbmFnZXIiLCJjb21wb25lbnRzIiwiQXJyYXkiLCJmcm9tIiwia2V5cyIsInJlZHVjZSIsImN1cnIiLCJuZXh0IiwiZW50aXRpZXMiLCJpIiwiZW50aXR5IiwibmV3RW50aXR5IiwiY2FwYWNpdHkiLCJjb21wb25lbnQiLCJyZXN1bHQiLCJjYWxsIiwicHVzaCIsImxlbmd0aCIsIkNvbXBvbmVudE1hbmFnZXIiLCJyZXQiLCJmb3JFYWNoIiwia2V5IiwibWF4IiwiTWF0aCIsIkluZmluaXR5IiwiU3lzdGVtVHlwZSIsIlN5c3RlbU1hbmFnZXIiLCJsb2dpY1N5c3RlbXMiLCJyZW5kZXJTeXN0ZW1zIiwiaW5pdFN5c3RlbXMiLCJ0eXBlIiwiY2FsbGJhY2siLCJMb2dpYyIsIlJlbmRlciIsIkluaXQiLCJzeXN0ZW0iLCJzeXN0ZW1JZCIsImRlbGV0ZSIsImVtcHR5UHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicHJvbWlzZSIsImNvbnRleHQiLCJhcmdzIiwidGltZW91dCIsImFwcGx5IiwiRXZlbnRIYW5kbGVyIiwiZXZlbnRzIiwiZXZlbnQiLCJoYXMiLCJldmVudElkIiwidmFsdWVzIiwic2VsZiIsImV2ZW50SGFuZGxlciIsImFyZ3VtZW50cyIsInNwbGljZSIsInByb21pc2VzIiwiYWxsIiwiY3VycmVudE1heEVudGl0eSIsImVudGl0eUZhY3RvcnkiLCJzeXN0ZW1NYW5hZ2VyIiwiY29tcG9uZW50TWFuYWdlciIsImVudGl0eUNvbmZpZ3VyYXRpb25zIiwiY29tcG9uZW50TG9va3VwIiwib2xkQ2FwYWNpdHkiLCJnZXRDb21wb25lbnRzIiwiY29tcG9uZW50TmFtZSIsInZhbHVlIiwiZW50cmllcyIsIm5ld0NvbXBvbmVudCIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiaXNBcnJheSIsImdldEVudGl0aWVzIiwiY29uZmlndXJhdGlvbklkIiwiY3JlYXRlQ29uZmlndXJhdGlvbiIsIm5hbWUiLCJyZWdpc3RlckNvbXBvbmVudCIsIk9iamVjdCIsInJlZ2lzdGVySW5pdGlhbGl6ZXIiLCJlbnRpdHlJZCIsInJlZ2lzdGVyU3lzdGVtIiwicmVtb3ZlU3lzdGVtIiwib3B0cyIsImJ1aWxkIiwid2l0aENvbXBvbmVudCIsIkVycm9yIiwiY3JlYXRlIiwibGlzdGVuIiwic3RvcExpc3RlbiIsInRyaWdnZXIiLCJ0cmlnZ2VyRGVsYXllZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBRUEsTUFBTUEsYUFBTixDQUFvQjtrQkFDRjthQUNMQyxJQUFMOzs7V0FHRzthQUNFQyxZQUFMLEdBQXFCLElBQUlDLEdBQUosRUFBckI7YUFDS0MsYUFBTCxHQUFxQixJQUFJRCxHQUFKLEVBQXJCOzs7d0JBR2dCRSxFQUFwQixFQUF3QkMsV0FBeEIsRUFBcUM7WUFDN0IsQ0FBQ0MsT0FBT0MsU0FBUCxDQUFpQkgsRUFBakIsQ0FBRCxJQUF5QkEsTUFBTSxDQUFuQyxFQUFzQztrQkFDNUJJLFVBQVUsZ0NBQVYsQ0FBTjs7O1lBR0EsT0FBT0gsV0FBUCxLQUF1QixVQUEzQixFQUF1QztrQkFDN0JHLFVBQVUsaUNBQVYsQ0FBTjs7O2FBR0NQLFlBQUwsQ0FBa0JRLEdBQWxCLENBQXNCTCxFQUF0QixFQUEwQkMsV0FBMUI7OztZQUdJO2FBQ0NGLGFBQUwsR0FBcUIsSUFBSUQsR0FBSixFQUFyQjs7ZUFFTyxJQUFQOzs7a0JBR1VRLFdBQWQsRUFBMkJMLFdBQTNCLEVBQXdDO1lBQ2hDLENBQUNDLE9BQU9DLFNBQVAsQ0FBaUJHLFdBQWpCLENBQUQsSUFBa0NBLGVBQWUsQ0FBckQsRUFBd0Q7bUJBQzdDLElBQVA7OztZQUdBLE9BQU9MLFdBQVAsS0FBdUIsVUFBM0IsRUFBdUM7MEJBQ3JCLEtBQUtKLFlBQUwsQ0FBa0JVLEdBQWxCLENBQXNCRCxXQUF0QixDQUFkOzs7YUFHQ1AsYUFBTCxDQUFtQk0sR0FBbkIsQ0FBdUJDLFdBQXZCLEVBQW9DTCxXQUFwQzs7ZUFFTyxJQUFQOzs7MEJBR2tCO2VBQ1gsS0FBS0YsYUFBWjs7O1dBR0dTLGFBQVAsRUFBc0JDLFFBQVEsQ0FBOUIsRUFBaUNWLGdCQUFnQlcsU0FBakQsRUFBNEQ7WUFDcEQsRUFBRUYseUJBQXlCRyxhQUEzQixDQUFKLEVBQStDO21CQUNwQyxFQUFQ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
