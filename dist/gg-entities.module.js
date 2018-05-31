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

        const id = max === null || max === undefined || max === -Infinity || max === 0 ? 1 : max * 2;

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

const emptyPromise = () => Promise.resolve();

const promise = (callback, context, args, timeout) => {
    if (timeout) {
        return new Promise(resolve => {
            setTimeout(function () {
                resolve(callback.call(context, ...args));
            }, timeout);
        });
    }

    return Promise.resolve(callback.call(context, ...args));
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
            components = Array.from(this.componentLookup).filter(cl => components.some(c => c === cl[0])).map(cl => cl[1]).reduce((curr, next) => curr | next, 0);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2ctZW50aXRpZXMubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29yZS9lbnRpdHktZmFjdG9yeS5qcyIsIi4uL3NyYy9jb3JlL2NvbXBvbmVudC1tYW5hZ2VyLmpzIiwiLi4vc3JjL2NvcmUvc3lzdGVtLW1hbmFnZXIuanMiLCIuLi9zcmMvY29yZS9ldmVudC1oYW5kbGVyLmpzIiwiLi4vc3JjL2NvcmUvZW50aXR5LW1hbmFnZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5TWFuYWdlciB9IGZyb20gJy4vZW50aXR5LW1hbmFnZXInXHJcblxyXG5jbGFzcyBFbnRpdHlGYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplcnMgID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlZ2lzdGVySW5pdGlhbGl6ZXIoaWQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGlkKSB8fCBpZCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignaWQgbXVzdCBiZSBhIHBvc2V0aXZlIGludGVnZXIuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsaXplciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ2luaXRpYWxpemVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVycy5zZXQoaWQsIGluaXRpYWxpemVyKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBidWlsZCgpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBuZXcgTWFwKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudElkLCBpbml0aWFsaXplcikge1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRJZCkgfHwgY29tcG9uZW50SWQgPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGluaXRpYWxpemVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVyID0gdGhpcy5pbml0aWFsaXplcnMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uc2V0KGNvbXBvbmVudElkLCBpbml0aWFsaXplcilcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgIH1cclxuICAgIFxyXG4gICAgY3JlYXRlKGVudGl0eU1hbmFnZXIsIGNvdW50ID0gMSwgY29uZmlndXJhdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghKGVudGl0eU1hbmFnZXIgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW11cclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB0aGlzLmNvbmZpZ3VyYXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IEFycmF5LmZyb20oY29uZmlndXJhdGlvbi5rZXlzKCkpLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gY3VyciB8PSBuZXh0LCAwKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlbnRpdGllcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCB7IGlkLCBlbnRpdHkgfSA9IGVudGl0eU1hbmFnZXIubmV3RW50aXR5KGNvbXBvbmVudHMpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaWQgPj0gZW50aXR5TWFuYWdlci5jYXBhY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgW2NvbXBvbmVudCwgaW5pdGlhbGl6ZXJdIG9mIGNvbmZpZ3VyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdGlhbGl6ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsaXplci5jYWxsKGVudGl0eVtjb21wb25lbnRdKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudGl0eVtjb21wb25lbnRdICE9PSAnb2JqZWN0JyAmJiByZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudGl0eVtjb21wb25lbnRdID0gcmVzdWx0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVudGl0aWVzLnB1c2goeyBpZCwgZW50aXR5IH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5sZW5ndGggPT09IDEgPyBlbnRpdGllc1swXSA6IGVudGl0aWVzXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEVudGl0eUZhY3RvcnkgfVxyXG4iLCJjbGFzcyBDb21wb25lbnRNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbmV3IE1hcCgpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0NvbXBvbmVudChjb21wb25lbnRJZCkge1xyXG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudElkKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb21wb25lbnQgPT09IG51bGwgfHwgY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50KClcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JyAgOiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKChjb21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0ID0ge31cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb21wb25lbnQpLmZvckVhY2goa2V5ID0+IHJldFtrZXldID0gY29tcG9uZW50W2tleV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFxyXG4gICAgICAgICAgICAgICAgfSkoY29tcG9uZW50KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAoY29tcG9uZW50ID09PSBudWxsIHx8IGNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZC4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi50aGlzLmNvbXBvbmVudHMua2V5cygpKVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IG1heCA9PT0gbnVsbCB8fCBtYXggPT09IHVuZGVmaW5lZCB8fCBtYXggPT09IC1JbmZpbml0eSB8fCBtYXggPT09IDAgPyAxIDogbWF4ICogMlxyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMuc2V0KGlkLCBjb21wb25lbnQpXHJcblxyXG4gICAgICAgIHJldHVybiBpZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXRDb21wb25lbnRzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudHNcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgQ29tcG9uZW50TWFuYWdlciB9XHJcbiIsImV4cG9ydCBjb25zdCBTeXN0ZW1UeXBlID0ge1xyXG4gICAgTG9naWMgIDogMCxcclxuICAgIFJlbmRlciA6IDEsXHJcbiAgICBJbml0ICAgOiAyXHJcbn1cclxuXHJcbmNsYXNzIFN5c3RlbU1hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmxvZ2ljU3lzdGVtcyAgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLnJlbmRlclN5c3RlbXMgPSBuZXcgTWFwKClcclxuICAgICAgICB0aGlzLmluaXRTeXN0ZW1zICAgPSBuZXcgTWFwKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJTeXN0ZW0odHlwZSwgY29tcG9uZW50cywgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZSAhPT0gU3lzdGVtVHlwZS5Mb2dpYyAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLlJlbmRlciAmJiB0eXBlICE9PSBTeXN0ZW1UeXBlLkluaXQpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCd0eXBlIG11c3QgYmUgYSB2YWxpZCBTeXN0ZW1UeXBlLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50cyAhPT0gJ251bWJlcicpICB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignY29tcG9uZW50cyBtdXN0IGJlIGEgbnVtYmVyLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJylcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc3lzdGVtID0ge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzLFxyXG4gICAgICAgICAgICBjYWxsYmFja1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzeXN0ZW1JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMubG9naWNTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5yZW5kZXJTeXN0ZW1zLmtleXMoKSwgLi4udGhpcy5pbml0U3lzdGVtcy5rZXlzKCkpICsgMVxyXG4gICAgICAgIFxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuTG9naWMgOiB0aGlzLmxvZ2ljU3lzdGVtcy5zZXQoc3lzdGVtSWQsIHN5c3RlbSk7IGJyZWFrXHJcbiAgICAgICAgICAgIGNhc2UgU3lzdGVtVHlwZS5SZW5kZXIgOiB0aGlzLnJlbmRlclN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgICAgICBjYXNlIFN5c3RlbVR5cGUuSW5pdCA6IHRoaXMuaW5pdFN5c3RlbXMuc2V0KHN5c3RlbUlkLCBzeXN0ZW0pOyBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc3lzdGVtSWRcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naWNTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5yZW5kZXJTeXN0ZW1zLmRlbGV0ZShzeXN0ZW1JZCkgfHwgdGhpcy5pbml0U3lzdGVtcy5kZWxldGUoc3lzdGVtSWQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IFN5c3RlbU1hbmFnZXIgfVxyXG4iLCJpbXBvcnQgeyBFbnRpdHlNYW5hZ2VyIH0gZnJvbSAnLi9lbnRpdHktbWFuYWdlcidcclxuXHJcbmNvbnN0IGVtcHR5UHJvbWlzZSA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpXHJcblxyXG5jb25zdCBwcm9taXNlID0gKGNhbGxiYWNrLCBjb250ZXh0LCBhcmdzLCB0aW1lb3V0KSA9PiB7XHJcbiAgICBpZiAodGltZW91dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FsbGJhY2suY2FsbChjb250ZXh0LCAuLi5hcmdzKSlcclxuICAgICAgICAgICAgfSwgdGltZW91dClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbGxiYWNrLmNhbGwoY29udGV4dCwgLi4uYXJncykpXHJcbn1cclxuICAgIFxyXG5jbGFzcyBFdmVudEhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pbml0KClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBNYXAoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsaXN0ZW4oZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KGV2ZW50LCBuZXcgTWFwKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBldmVudElkID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgZXZlbnRJZCA9IE1hdGgubWF4KGV2ZW50SWQsIC4uLmV2ZW50LmtleXMoKSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgICsrZXZlbnRJZFxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZXZlbnRzLmdldChldmVudCkuc2V0KGV2ZW50SWQsIGNhbGxiYWNrKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBldmVudElkXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0b3BMaXN0ZW4oZXZlbnRJZCkge1xyXG4gICAgICAgIGZvciAobGV0IGV2ZW50cyBvZiB0aGlzLmV2ZW50cy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBvZiBldmVudHMua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09IGV2ZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnRzLmRlbGV0ZShldmVudElkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBFbnRpdHlNYW5hZ2VyID8gdGhpcy5ldmVudEhhbmRsZXIgOiB0aGlzXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cylcclxuICAgICAgICBcclxuICAgICAgICBsZXQgWyBldmVudCBdID0gYXJncy5zcGxpY2UoMCwgMSlcclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJyB8fCAhc2VsZi5ldmVudHMuaGFzKGV2ZW50KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW1wdHlQcm9taXNlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHByb21pc2VzID0gW11cclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50cy5nZXQoZXZlbnQpLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZShjYWxsYmFjaywgdGhpcywgYXJncykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzIGluc3RhbmNlb2YgRW50aXR5TWFuYWdlciA/IHRoaXMuZXZlbnRIYW5kbGVyIDogdGhpc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IFsgZXZlbnQsIHRpbWVvdXQgXSA9IGFyZ3Muc3BsaWNlKDAsIDIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycgfHwgIU51bWJlci5pc0ludGVnZXIodGltZW91dCkgfHwgIXNlbGYuZXZlbnRzLmhhcyhldmVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVtcHR5UHJvbWlzZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBwcm9taXNlcyA9IFtdXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgY2FsbGJhY2sgb2Ygc2VsZi5ldmVudHMuZ2V0KGV2ZW50KS52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UoY2FsbGJhY2ssIHRoaXMsIGFyZ3MsIHRpbWVvdXQpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IEV2ZW50SGFuZGxlciB9XHJcbiIsImltcG9ydCB7IEVudGl0eUZhY3RvcnkgfSAgICAgICAgICAgICBmcm9tICcuL2VudGl0eS1mYWN0b3J5J1xyXG5pbXBvcnQgeyBDb21wb25lbnRNYW5hZ2VyIH0gICAgICAgICAgZnJvbSAnLi9jb21wb25lbnQtbWFuYWdlcidcclxuaW1wb3J0IHsgU3lzdGVtTWFuYWdlciwgU3lzdGVtVHlwZSB9IGZyb20gJy4vc3lzdGVtLW1hbmFnZXInXHJcbmltcG9ydCB7IEV2ZW50SGFuZGxlciB9ICAgICAgICAgICAgICBmcm9tICcuL2V2ZW50LWhhbmRsZXInXHJcblxyXG5jbGFzcyBFbnRpdHlNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMTAwMCkge1xyXG4gICAgICAgIHRoaXMuaW5pdChjYXBhY2l0eSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5pdChjYXBhY2l0eSkge1xyXG4gICAgICAgIHRoaXMuY2FwYWNpdHkgICAgICAgICA9IGNhcGFjaXR5XHJcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4RW50aXR5ID0gLTFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkgICAgPSBuZXcgRW50aXR5RmFjdG9yeSgpXHJcbiAgICAgICAgdGhpcy5zeXN0ZW1NYW5hZ2VyICAgID0gbmV3IFN5c3RlbU1hbmFnZXIoKVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50TWFuYWdlciA9IG5ldyBDb21wb25lbnRNYW5hZ2VyKClcclxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlciAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zID0gbmV3IE1hcCgpXHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRMb29rdXAgICAgICA9IG5ldyBNYXAoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoIDogdGhpcy5jYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbmNyZWFzZUNhcGFjaXR5KCkge1xyXG4gICAgICAgIGxldCBvbGRDYXBhY2l0eSA9IHRoaXMuY2FwYWNpdHlcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNhcGFjaXR5ICo9IDJcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0aWVzID0gWy4uLnRoaXMuZW50aXRpZXMsIC4uLkFycmF5LmZyb20oeyBsZW5ndGggOiBvbGRDYXBhY2l0eSB9LCAoKSA9PiAoeyBjb21wb25lbnRzOiAwIH0pKV1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IG9sZENhcGFjaXR5OyBpIDwgdGhpcy5jYXBhY2l0eTsgKytpKSB7XHJcbiAgICAgICAgICAgIGxldCBlbnRpdHkgPSB0aGlzLmVudGl0aWVzW2ldXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudElkIG9mIHRoaXMuY29tcG9uZW50TWFuYWdlci5nZXRDb21wb25lbnRzKCkua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMuY29tcG9uZW50TG9va3VwLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gY29tcG9uZW50SWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZSA9IGtleVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIGNvbXBvbmVudE5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5ld0VudGl0eShjb21wb25lbnRzKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50cykpIHtcclxuICAgICAgICAgICAgY29tcG9uZW50cyA9IEFycmF5LmZyb20odGhpcy5jb21wb25lbnRMb29rdXApLnJlZHVjZSgoY3VyciwgbmV4dCkgPT4gWycnLCBjdXJyWzFdIHwgbmV4dFsxXV0sIFsnJywgMF0pWzFdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb21wb25lbnRzKSB8fCBjb21wb25lbnRzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGlkID0gMFxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAoOyBpZCA8IHRoaXMuY2FwYWNpdHk7ICsraWQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID49IHRoaXMuY2FwYWNpdHkpIHtcclxuICAgICAgICAgICAgLy8gdG9kbzogYXV0byBpbmNyZWFzZSBjYXBhY2l0eT9cclxuICAgICAgICAgICAgcmV0dXJuIHsgaWQgOiB0aGlzLmNhcGFjaXR5LCBlbnRpdHkgOiBudWxsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlkID4gdGhpcy5jdXJyZW50TWF4RW50aXR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1heEVudGl0eSA9IGlkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZW50aXRpZXNbaWRdLmNvbXBvbmVudHMgPSBjb21wb25lbnRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgZGVsZXRlRW50aXR5KGlkKSB7XHJcbiAgICAgICAgLy90b2RvIGFkZCBzYW5pdHkgY2hlY2tcclxuICAgICAgICB0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzID0gMFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpZCA8IHRoaXMuY3VycmVudE1heEVudGl0eSkge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGlkOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lbnRpdGllc1tpXS5jb21wb25lbnRzICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSBpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRNYXhFbnRpdHkgPSAwXHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG9lcyBub3QgYWxsb3cgY29tcG9uZW50cyB0byBiZSBhbnl0aGluZyBvdGhlciB0aGFuIGEgYml0bWFzayBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xyXG4gICAgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHN5c3RlbSBmb3IgZXZlcnkgbG9vcCAod2hpY2ggbWlnaHQgYmUgYXMgaGlnaCBhcyA2MCAvIHNlY29uZClcclxuICAgICpnZXRFbnRpdGllcyhjb21wb25lbnRzID0gMCkge1xyXG4gICAgICAgIGZvciAobGV0IGlkID0gMDsgaWQgPD0gdGhpcy5jdXJyZW50TWF4RW50aXR5OyArK2lkKSB7XHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzID09PSAwIHx8ICh0aGlzLmVudGl0aWVzW2lkXS5jb21wb25lbnRzICYgY29tcG9uZW50cykgPT09IGNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIHsgaWQsIGVudGl0eSA6IHRoaXMuZW50aXRpZXNbaWRdIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25JZCA9IE1hdGgubWF4KDAsIC4uLnRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMua2V5cygpKSArIDFcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmVudGl0eUNvbmZpZ3VyYXRpb25zLnNldChjb25maWd1cmF0aW9uSWQsIHRoaXMuZW50aXR5RmFjdG9yeS5jcmVhdGVDb25maWd1cmF0aW9uKCkpXHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyYXRpb25JZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBDb21wb25lbnQgTWFuYWdlclxyXG4gICAgXHJcbiAgICByZWdpc3RlckNvbXBvbmVudChuYW1lLCBjb21wb25lbnQpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcignbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KG5hbWUpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gdGhpcy5jb21wb25lbnRNYW5hZ2VyLnJlZ2lzdGVyQ29tcG9uZW50KGNvbXBvbmVudClcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbXBvbmVudExvb2t1cC5zZXQobmFtZSwgY29tcG9uZW50SWQpXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIHRoaXMuZW50aXRpZXMpIHtcclxuICAgICAgICAgICAgZW50aXR5W2NvbXBvbmVudElkXSA9IHRoaXMuY29tcG9uZW50TWFuYWdlci5uZXdDb21wb25lbnQoY29tcG9uZW50SWQpXHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbnRpdHksIG5hbWUsIHsgZ2V0KCkgeyByZXR1cm4gdGhpc1tjb21wb25lbnRJZF0gfSwgY29uZmlndXJhYmxlOiB0cnVlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBpbml0aWFsaXplclxyXG5cclxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBjb21wb25lbnQpIHtcclxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOiBpbml0aWFsaXplciA9IGNvbXBvbmVudDsgYnJlYWtcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0Jzoge1xyXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBjb21wb25lbnRba2V5XVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGluaXRpYWxpemVyID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb21wb25lbnQgfTsgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LnJlZ2lzdGVySW5pdGlhbGl6ZXIoY29tcG9uZW50SWQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBjb21wb25lbnRJZFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhZGRDb21wb25lbnQoZW50aXR5SWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0aWVzW2VudGl0eUlkXS5jb21wb25lbnRzIHw9IHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyB8PSBjb21wb25lbnRcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHlJZCwgY29tcG9uZW50KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXRpZXNbZW50aXR5SWRdLmNvbXBvbmVudHMgJj0gfnRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdGllc1tlbnRpdHlJZF0uY29tcG9uZW50cyAmPSB+Y29tcG9uZW50ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTeXN0ZW0gTWFuYWdlclxyXG4gICAgXHJcbiAgICByZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudHMgPSBBcnJheVxyXG4gICAgICAgICAgICAgICAgLmZyb20odGhpcy5jb21wb25lbnRMb29rdXApXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGNsID0+IGNvbXBvbmVudHMuc29tZShjID0+IGMgPT09IGNsWzBdKSlcclxuICAgICAgICAgICAgICAgIC5tYXAoY2wgPT4gY2xbMV0pXHJcbiAgICAgICAgICAgICAgICAucmVkdWNlKChjdXJyLCBuZXh0KSA9PiBjdXJyIHwgbmV4dCwgMClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZWdpc3RlclN5c3RlbSh0eXBlLCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJMb2dpY1N5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuTG9naWMsIGNvbXBvbmVudHMsIGNhbGxiYWNrKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZWdpc3RlclJlbmRlclN5c3RlbShjb21wb25lbnRzLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyU3lzdGVtKFN5c3RlbVR5cGUuUmVuZGVyLCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVnaXN0ZXJJbml0U3lzdGVtKGNvbXBvbmVudHMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJTeXN0ZW0oU3lzdGVtVHlwZS5Jbml0LCBjb21wb25lbnRzLCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlU3lzdGVtKHN5c3RlbUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtTWFuYWdlci5yZW1vdmVTeXN0ZW0oc3lzdGVtSWQpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIG9uTG9naWMob3B0cykge1xyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIubG9naWNTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgb25SZW5kZXIob3B0cykge1xyXG4gICAgICAgIGZvciAobGV0IHN5c3RlbSBvZiB0aGlzLnN5c3RlbU1hbmFnZXIucmVuZGVyU3lzdGVtcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBzeXN0ZW0uY2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLmdldEVudGl0aWVzKHN5c3RlbS5jb21wb25lbnRzKSwgb3B0cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25Jbml0KG9wdHMpIHtcclxuICAgICAgICBmb3IgKGxldCBzeXN0ZW0gb2YgdGhpcy5zeXN0ZW1NYW5hZ2VyLmluaXRTeXN0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIHN5c3RlbS5jYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0RW50aXRpZXMoc3lzdGVtLmNvbXBvbmVudHMpLCBvcHRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRW50aXR5IEZhY3RvcnlcclxuICAgIFxyXG4gICAgcmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS5yZWdpc3RlckluaXRpYWxpemVyKHRoaXMuY29tcG9uZW50TG9va3VwLmdldChjb21wb25lbnQpLCBpbml0aWFsaXplcilcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVudGl0eUZhY3RvcnkucmVnaXN0ZXJJbml0aWFsaXplcihjb21wb25lbnQsIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgYnVpbGQoKSB7XHJcbiAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LmJ1aWxkKClcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB3aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbnRpdHlGYWN0b3J5LndpdGhDb21wb25lbnQodGhpcy5jb21wb25lbnRMb29rdXAuZ2V0KGNvbXBvbmVudCksIGluaXRpYWxpemVyKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW50aXR5RmFjdG9yeS53aXRoQ29tcG9uZW50KGNvbXBvbmVudCwgaW5pdGlhbGl6ZXIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNyZWF0ZShjb3VudCwgY29uZmlndXJhdGlvbklkKSB7XHJcbiAgICAgICAgbGV0IGNvbmZpZ3VyYXRpb24gPSB1bmRlZmluZWRcclxuICAgICAgICBcclxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb25maWd1cmF0aW9uSWQpICYmIGNvbmZpZ3VyYXRpb25JZCA+IDApIHtcclxuICAgICAgICAgICAgY29uZmlndXJhdGlvbiA9IHRoaXMuZW50aXR5Q29uZmlndXJhdGlvbnMuZ2V0KGNvbmZpZ3VyYXRpb25JZClcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VsZCBub3QgZmluZCBlbnRpdHkgY29uZmlndXJhdGlvbi4gSWYgeW91IHdpc2ggdG8gY3JlYXRlIGVudGl0aWVzIHdpdGhvdXQgYSBjb25maWd1cmF0aW9uLCBkbyBub3QgcGFzcyBhIGNvbmZpZ3VyYXRpb25JZC4nKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmVudGl0eUZhY3RvcnkuY3JlYXRlKHRoaXMsIGNvdW50LCBjb25maWd1cmF0aW9uKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFdmVudCBIYW5kbGVyXHJcbiAgICBcclxuICAgIGxpc3RlbihldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIubGlzdGVuKGV2ZW50LCBjYWxsYmFjaylcclxuICAgIH1cclxuICAgIFxyXG4gICAgc3RvcExpc3RlbihldmVudElkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnN0b3BMaXN0ZW4oZXZlbnRJZClcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXIudHJpZ2dlci5jYWxsKHRoaXMsIC4uLmFyZ3VtZW50cylcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJpZ2dlckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyLnRyaWdnZXJEZWxheWVkLmNhbGwodGhpcywgLi4uYXJndW1lbnRzKVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBFbnRpdHlNYW5hZ2VyIH1cclxuIl0sIm5hbWVzIjpbIkVudGl0eUZhY3RvcnkiLCJpbml0IiwiaW5pdGlhbGl6ZXJzIiwiTWFwIiwiY29uZmlndXJhdGlvbiIsImlkIiwiaW5pdGlhbGl6ZXIiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJUeXBlRXJyb3IiLCJzZXQiLCJjb21wb25lbnRJZCIsImdldCIsImVudGl0eU1hbmFnZXIiLCJjb3VudCIsInVuZGVmaW5lZCIsIkVudGl0eU1hbmFnZXIiLCJjb21wb25lbnRzIiwiQXJyYXkiLCJmcm9tIiwia2V5cyIsInJlZHVjZSIsImN1cnIiLCJuZXh0IiwiZW50aXRpZXMiLCJpIiwiZW50aXR5IiwibmV3RW50aXR5IiwiY2FwYWNpdHkiLCJjb21wb25lbnQiLCJyZXN1bHQiLCJjYWxsIiwicHVzaCIsImxlbmd0aCIsIkNvbXBvbmVudE1hbmFnZXIiLCJyZXQiLCJmb3JFYWNoIiwia2V5IiwibWF4IiwiTWF0aCIsIkluZmluaXR5IiwiU3lzdGVtVHlwZSIsIlN5c3RlbU1hbmFnZXIiLCJsb2dpY1N5c3RlbXMiLCJyZW5kZXJTeXN0ZW1zIiwiaW5pdFN5c3RlbXMiLCJ0eXBlIiwiY2FsbGJhY2siLCJMb2dpYyIsIlJlbmRlciIsIkluaXQiLCJzeXN0ZW0iLCJzeXN0ZW1JZCIsImRlbGV0ZSIsImVtcHR5UHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicHJvbWlzZSIsImNvbnRleHQiLCJhcmdzIiwidGltZW91dCIsIkV2ZW50SGFuZGxlciIsImV2ZW50cyIsImV2ZW50IiwiaGFzIiwiZXZlbnRJZCIsInZhbHVlcyIsInNlbGYiLCJldmVudEhhbmRsZXIiLCJhcmd1bWVudHMiLCJzcGxpY2UiLCJwcm9taXNlcyIsImFsbCIsImN1cnJlbnRNYXhFbnRpdHkiLCJlbnRpdHlGYWN0b3J5Iiwic3lzdGVtTWFuYWdlciIsImNvbXBvbmVudE1hbmFnZXIiLCJlbnRpdHlDb25maWd1cmF0aW9ucyIsImNvbXBvbmVudExvb2t1cCIsIm9sZENhcGFjaXR5IiwiZ2V0Q29tcG9uZW50cyIsImNvbXBvbmVudE5hbWUiLCJ2YWx1ZSIsImVudHJpZXMiLCJuZXdDb21wb25lbnQiLCJkZWZpbmVQcm9wZXJ0eSIsImNvbmZpZ3VyYWJsZSIsImlzQXJyYXkiLCJnZXRFbnRpdGllcyIsImNvbmZpZ3VyYXRpb25JZCIsImNyZWF0ZUNvbmZpZ3VyYXRpb24iLCJuYW1lIiwicmVnaXN0ZXJDb21wb25lbnQiLCJPYmplY3QiLCJyZWdpc3RlckluaXRpYWxpemVyIiwiZW50aXR5SWQiLCJmaWx0ZXIiLCJjbCIsInNvbWUiLCJjIiwibWFwIiwicmVnaXN0ZXJTeXN0ZW0iLCJyZW1vdmVTeXN0ZW0iLCJvcHRzIiwiYnVpbGQiLCJ3aXRoQ29tcG9uZW50IiwiRXJyb3IiLCJjcmVhdGUiLCJsaXN0ZW4iLCJzdG9wTGlzdGVuIiwidHJpZ2dlciIsInRyaWdnZXJEZWxheWVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxNQUFNQSxhQUFOLENBQW9CO2tCQUNGO2FBQ0xDLElBQUw7OztXQUdHO2FBQ0VDLFlBQUwsR0FBcUIsSUFBSUMsR0FBSixFQUFyQjthQUNLQyxhQUFMLEdBQXFCLElBQUlELEdBQUosRUFBckI7Ozt3QkFHZ0JFLEVBQXBCLEVBQXdCQyxXQUF4QixFQUFxQztZQUM3QixDQUFDQyxPQUFPQyxTQUFQLENBQWlCSCxFQUFqQixDQUFELElBQXlCQSxNQUFNLENBQW5DLEVBQXNDO2tCQUM1QkksVUFBVSxnQ0FBVixDQUFOOzs7WUFHQSxPQUFPSCxXQUFQLEtBQXVCLFVBQTNCLEVBQXVDO2tCQUM3QkcsVUFBVSxpQ0FBVixDQUFOOzs7YUFHQ1AsWUFBTCxDQUFrQlEsR0FBbEIsQ0FBc0JMLEVBQXRCLEVBQTBCQyxXQUExQjs7O1lBR0k7YUFDQ0YsYUFBTCxHQUFxQixJQUFJRCxHQUFKLEVBQXJCOztlQUVPLElBQVA7OztrQkFHVVEsV0FBZCxFQUEyQkwsV0FBM0IsRUFBd0M7WUFDaEMsQ0FBQ0MsT0FBT0MsU0FBUCxDQUFpQkcsV0FBakIsQ0FBRCxJQUFrQ0EsZUFBZSxDQUFyRCxFQUF3RDttQkFDN0MsSUFBUDs7O1lBR0EsT0FBT0wsV0FBUCxLQUF1QixVQUEzQixFQUF1QzswQkFDckIsS0FBS0osWUFBTCxDQUFrQlUsR0FBbEIsQ0FBc0JELFdBQXRCLENBQWQ7OzthQUdDUCxhQUFMLENBQW1CTSxH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
